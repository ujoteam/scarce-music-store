require('dotenv/config');
const express = require('express');
const Ethers = require('ethers');
// const HDWalletProvider = require('truffle-hdwallet-provider');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');
const AWS = require('aws-sdk');

const toPairs = require('lodash/toPairs');
const flatten = require('lodash/flatten');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');

const ffmpeg = require('fluent-ffmpeg');
const { pipeFileToS3 } = require('./s3');

AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = 'ujo-licensing-media';

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });

const redis = require('./redis');
const MetaAuth = require('../meta-auth');
// const LicenseContract = require('../UjoLicensingClass/LicenseCore.json');
const UjoLicensing = require('../dist/UjoLicensingClass');

// ES6 quirk. could be fixed by transpiling everything
const UjoLicense = new UjoLicensing.default(new Ethers.providers.JsonRpcProvider('http://localhost:8545'));

const songs = [
  'https://freemusicarchive.org/file/music/no_curator/spectacular/What_Whas_That/spectacular_-_01_-_What_Was_That_Spectacular_Sound_Productions.mp3',
  'https://freemusicarchive.org/file/music/Music_for_Video/Pictures_of_the_Floating_World/Canada/Pictures_of_the_Floating_World_-_01_-_Canada.mp3',
  'https://freemusicarchive.org/file/music/no_curator/Himalayha/II/Himalayha_-_05_-_To_Perto_To_Longe.mp3',
  'https://freemusicarchive.org/file/music/Music_for_Video/Pictures_of_the_Floating_World/Formal_Haut/Pictures_of_the_Floating_World_-_Fomalhaut.mp3',
  'https://freemusicarchive.org/file/music/none_given/TRG_Banks/TRG_Banks_-_Singles/TRG_Banks_-_Ring_road.mp3',
  'https://freemusicarchive.org/file/music/WFMU/Lee_Rosevere/Blue_Dot_RMX/Lee_Rosevere_-_01_-_Sky_Chaser.mp3',
  'https://freemusicarchive.org/file/music/ccCommunity/Daniel_Birch/Music_For_Audio_Drama_Podcasts_Vol1/Daniel_Birch_-_07_-_Marimba_On_The_Loose.mp3',
];

// development
if (process.env.NODE_ENV !== 'production') {
  // contractAddress = '';
  //   web3 = new Ethers.providers.JsonRpcProvider();
  // } else {
  //   UjoLicensing = new LicensingHelper();
  // UjoLicensing.init();
  // production
  // contractAddress = '';
  // TODO: not sure how to handle this case at the moment
  // const mnemonic = process.env.MNEMONIC;
  // const infuraApi = process.env.INFURA_API;
  // web3 = new Ethers(new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/${infuraApi}`));
}

redis.init();
const port = process.env.PORT || '3001';
const app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// cors
app.use(cors());

// jwt
const JWT_SECRET = 'jwt secret @@TODO';
app.use(
  expressJWT({
    secret: JWT_SECRET,
    credentialsRequired: false,
    getToken: req => {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
      }
      if (req.query && req.query.jwt) {
        return req.query.jwt;
      }
      return null;
    },
  }),
);

// Set up some middleware
const metaAuth = new MetaAuth({ banner: 'Ujo Licensing' });
const asyncMW = fn => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next) }

app.use('/', express.static('.'));


//
// Authentication, step 1.  Request a challenge message from the server which will be signed by the user.
//
app.get('/login/:MetaAddress', metaAuth, (req, res) => {
  if (req.metaAuth && req.metaAuth.challenge) {
    res.send({ challenge: req.metaAuth.challenge });
  } else {
    res.status(500).send();
  }
});

//
// Authentication, step 2.  Recovers the user's ETH address from the signed challenge, and sets
// a JWT that identifies the user for subsequent requests.
//
app.get('/login/:MetaMessage/:MetaSignature', metaAuth, async (req, res) => {
  if (req.metaAuth && req.metaAuth.recovered) {
    const ethAddress = req.metaAuth.recovered;
    const token = jwt.sign({ ethAddress }, JWT_SECRET);
    res.status(200).json({ jwt: token });
  } else {
    // Sig did not match, invalid authentication
    res.status(401).send();
  }
});

//
// Fetch the list of stores deployed by the current user.
//
app.post('/auth', (req, res) => {
  const userAddress = req.body.address;

  try {
    if (fs.existsSync('./server/db.json')) {
      const cont = fs.readFileSync('./server/db.json', 'utf8');
      let userInfo = JSON.parse(cont);
      userInfo = Object.assign({}, userInfo); // not sure why I need this

      if (userInfo[userAddress]) {
        return res.json(userInfo[userAddress]);
      }
      userInfo[userAddress] = [];
      fs.writeFileSync('./server/db.json', JSON.stringify(userInfo));
      return res.json(userInfo[userAddress]);
    }
    const userInfo = {};
    userInfo[userAddress] = [];
    // fs.mkdir('./server', err => {
    //   if (err) throw err;
    //   fs.writeFileSync('./server/db.json', JSON.stringify(userInfo));
    res.json(userInfo[userAddress]);
    // });
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

//
// Tell the backend that you've deployed a store contract.
//
app.post('/deploy-store', (req, res) => {
  const userAddress = req.body.address;
  const { contractAddresses } = req.body;

  const cont = fs.readFileSync('./server/db.json', 'utf8');
  let userInfo = JSON.parse(cont);
  userInfo = Object.assign({}, userInfo); // not sure why I need this

  if (!userInfo[userAddress]) res.status(500).json({ error: 'we could not find your user account' });
  else {
    userInfo[userAddress].push(contractAddresses);
    fs.writeFileSync('./server/db.json', JSON.stringify(userInfo));
    res.status(200).send();
  }
});

//
// Upload new content.
//
app.post('/upload/:contractAddress/:productID', async (req, res) => {
  const { contractAddress, productID } = req.params;

  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      // files: 1,
      fileSize: process.env.MAX_UPLOAD_SIZE || 30 * 1024 * 1024, // default to 30mb max upload size
    },
  });

  const uploadOps = [];
  busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
    const trackIndex = uploadOps.length / 2;

    const originalFilename = `${contractAddress}/${productID}/${trackIndex}.mp3`;
    const originalFile = ffmpeg(fileStream)
      .format('mp3')
      .pipe();

    const previewFilename = `${contractAddress}/${productID}/${trackIndex}-preview.mp3`;
    const previewFile = ffmpeg(originalFile)
      .format('mp3')
      .duration(10)
      .pipe();

    uploadOps.push(pipeFileToS3(originalFile, originalFilename, BUCKET_NAME));
    uploadOps.push(pipeFileToS3(previewFile, previewFilename, BUCKET_NAME));
  });

  busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
    // ...
  });

  busboy.on('finish', async () => {
    console.log('finished receiving file uploads');

    await Promise.all(uploadOps);
    console.log('S3 uploads complete.');

    return res.json({});
  });

  req.pipe(busboy);
});

//
// Stream the given content.
//
app.get('/content/:contractAddress/:productID/:trackIndex', async (req, res) => {
  const ethAddress = req.user ? req.user.ethAddress : null;
  const { contractAddress, productID, trackIndex } = req.params;
  const { download } = req.query;

  let userOwnsLicense = false;
  if (ethAddress) {
    let productIds = await UjoLicense.getOwnedProductIds(ethAddress, contractAddress, 0);
    productIds = productIds.map(id => id.toString());
    userOwnsLicense = productIds.indexOf(productID) > -1;
  }

  // @@TODO: store better metadata describing where content is stored, because S3 can't simply be
  // fetched via a URL.  We have to use the authenticated client.  We might support other 3rd party
  // stores with their own auth schemes as well.

  const s3ContentKey = userOwnsLicense
    ? `${contractAddress}/${productID}/${trackIndex}.mp3`
    : `${contractAddress}/${productID}/${trackIndex}-preview.mp3`;

  if (download) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(s3ContentKey)}"`);
  }

  try {
    const s3 = new AWS.S3({});
    const params = { Bucket: BUCKET_NAME, Key: s3ContentKey };
    s3.getObject(params)
      .createReadStream()
      .pipe(res);
  } catch (err) {
    console.log('ERROR: ', err);
    res.status(500).json({ error: err.toString() });
  }
});

//
// Fetch metadata for the given productID
//
app.get('/metadata/:contractAddress/:productID', async (req, res) => {
  const { contractAddress, productID } = req.params;
  const metadata = await redis.getMetadata(contractAddress, productID);
  metadata.tracks = metadata.tracks || [];

  // Filter out details that the end user shouldn't be able to know
  // @@TODO: if a content URL points elsewhere, rather than to our managed service, we probably
  // shouldn't filter it out (?)
  metadata.tracks = metadata.tracks.map((track = omit(track, ['url']))); // Filter out the hidden track URLs
  res.json(metadata);
});

//
// Store metadata for the given productID
//
app.post('/metadata/:contractAddress/:productID', async (req, res) => {
  const { contractAddress, productID } = req.params;
  const metadata = await redis.setMetadata(contractAddress, productID, req.body);
  res.json({});
});

//
// Update the contract address
//
app.post('/update-address', (req, res) => {
  console.log('Updating contract address', req.body.address);
  contractAddress = req.body.address;
  res.status(200).send();
});

app.get('/auth/:MetaAddress', metaAuth, (req, res) => {
  // Request a message from the server
  if (req.metaAuth && req.metaAuth.challenge) {
    res.send(req.metaAuth.challenge);
  } else {
    res.status(500);
  }
});

app.get('/auth/:MetaMessage/:MetaSignature/:contractAddress', metaAuth, async (req, res) => {
  if (req.metaAuth && req.metaAuth.recovered) {
    console.log('Checking if account owns the token');
    let productIds = await UjoLicense.getOwnedProductIds(req.metaAuth.recovered, req.params.contractAddress, 0);
    productIds = productIds.map(id => id.toString());

    if (productIds.indexOf(req.params.MetaMessage) > -1) res.send(req.metaAuth.recovered);
    else res.status(401).send();
  } else {
    // Sig did not match, invalid authentication
    res.status(401).send();
  }
});

//
// Replenish the requesting user's ETH + DAI
//
app.get('/faucet', asyncMW(async (req, res, next) => {
  console.log('faucet route', req.user)
  if (!req.user) {
    return res.status(403).json({})
  }

  const { ethAddress } = req.user
  // const daiContractInstance = new Ethers.Contract(process.env.DAI_CONTRACT_ADDRESS, ERC20.abi, UjoLicense.provider.getSigner(0))
  const amount = parseFloat(req.query.amount || '1.0')
  const maxFaucetSendAmount = parseFloat(process.env.MAX_FAUCET_SEND_AMOUNT || '1.0')

  // If the user already has enough ETH, don't do anything.
  const balance = await UjoLicense.provider.getBalance(ethAddress)
  const maxAmount = Ethers.utils.parseEther(`${maxFaucetSendAmount}`)
  if (balance.gte( maxAmount )) {
      return res.status(200).json({ result: 'you have plenty of ETH already', address: ethAddress, balance: Ethers.utils.formatEther(balance) })
  }

  const weiToSend = Ethers.utils.parseEther(Math.min(amount, maxFaucetSendAmount).toString())
  const wallet = Ethers.Wallet.fromMnemonic(process.env.ETH_MNEMONIC).connect(UjoLicense.provider)
  const tx = await wallet.sendTransaction({ to: ethAddress, value: weiToSend })

  return res.status(200).json({ result: 'sent you some ETH' })
}))

//
// Error handler
//
app.use((err, req, res, next) => {
  console.error(err);
  console.log(next);

  if (err.statusCode) {
    // instance of HTTPError
    res.status(err.statusCode).json({ error: err.message });
  } else {
    // something else
    res.status(500).json({ error: `Unhandled error: ${err.toString()}` });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
