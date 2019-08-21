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
const omit = require('lodash/omit');
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
const ERC20 = require('../UjoLicensingClass/ERC20.json')

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

redis.init()
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
app.get('/stores', asyncMW(async (req, res) => {
  let stores
  if (req.query.mine) {
    if (!req.user || !req.user.ethAddress) {
      return res.status(400).json({ error: 'cannot specify "mine" when not logged in' })
    }
    stores = await redis.getStores({ userAddress: req.user.ethAddress })
  } else {
    stores = await redis.getStores()
  }

  res.json(stores)
}))

//
// Tell the backend that you've deployed a store contract.
//
app.post('/stores', asyncMW(async (req, res) => {
  if (!req.user || !req.user.ethAddress) {
    return res.status(403).json({ error: 'you are not logged in' })
  }

  const userAddress = req.user.ethAddress;
  const { contractAddresses } = req.body;

  await redis.addStore(userAddress, contractAddresses)

  res.json({})
}))

//
// Upload new content.
//
app.post('/upload/:storeId/:productID', async (req, res) => {
  const { storeId, productID } = req.params;

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

    const originalFilename = `${storeId}/${productID}/${trackIndex}.mp3`;
    const originalFile = ffmpeg(fileStream)
      .format('mp3')
      .pipe();

    const previewFilename = `${storeId}/${productID}/${trackIndex}-preview.mp3`;
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
app.get('/metadata/:storeId/:productID', async (req, res) => {
  const { storeId, productID } = req.params;
  const metadata = await redis.getMetadata(storeId, productID);
  metadata.tracks = metadata.tracks || [];

  // Filter out details that the end user shouldn't be able to know
  // @@TODO: if a content URL points elsewhere, rather than to our managed service, we probably
  // shouldn't filter it out (?)
  metadata.tracks = metadata.tracks.map(track => omit(track, ['url'])); // Filter out the hidden track URLs
  res.json(metadata);
});

//
// Store metadata for the given productID
//
app.post('/metadata/:storeId/:productID', asyncMW(async (req, res) => {
  const { storeId, productID } = req.params;
  const metadata = await redis.setMetadata(storeId, productID, req.body);
  res.json({});
}))

//
// Replenish the requesting user's ETH + DAI
//
app.get('/faucet', asyncMW(async (req, res, next) => {
  console.log('faucet route', req.user)
  if (!req.user) {
    return res.status(403).json({})
  }

  const { ethAddress } = req.user
  const backendWallet = Ethers.Wallet.fromMnemonic(process.env.ETH_MNEMONIC).connect(UjoLicense.provider)

  const ethMax = Ethers.utils.parseEther(process.env.MAX_FAUCET_ETH_AMOUNT || '1.0')
  const daiMax = Ethers.utils.bigNumberify(process.env.MAX_FAUCET_DAI_AMOUNT || '10000')

  const ethBalance = await UjoLicense.provider.getBalance(ethAddress)
  if (ethBalance.lt( ethMax )) {
    const weiToSend = ethMax.sub(ethBalance)
    const ethTx = await backendWallet.sendTransaction({ to: ethAddress, value: weiToSend })
    console.log('ethTx ~>', ethTx)
  }


  const daiContractInstance = new Ethers.Contract(process.env.DAI_CONTRACT_ADDRESS, ERC20.abi, backendWallet);
  const daiBalance = await daiContractInstance.balanceOf(ethAddress)
  if (daiBalance.lt( daiMax )) {
    const daiToSend = daiMax.sub(daiBalance)
    const daiTx = await daiContractInstance.transfer(ethAddress, daiToSend)
    console.log('daiTx ~>', daiTx)
  }

  console.log('DAI bal ~>', (await daiContractInstance.balanceOf(ethAddress)).toString())

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
