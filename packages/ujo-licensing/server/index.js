require('dotenv/config');
const express = require('express');
const Ethers = require('ethers');
const HDWalletProvider = require('truffle-hdwallet-provider');
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
const UjoLicense = new UjoLicensing.default();

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

const metaAuth = new MetaAuth({
  banner: 'Ujo Licensing',
});

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
    fs.mkdir('./server', err => {
      if (err) throw err;
      fs.writeFileSync('./server/db.json', JSON.stringify(userInfo));
      res.json(userInfo[userAddress]);
    });

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
  const storeAddress = req.body.contractAddress;

  const cont = fs.readFileSync('./server/db.json', 'utf8');
  let userInfo = JSON.parse(cont);
  userInfo = Object.assign({}, userInfo); // not sure why I need this

  if (!userInfo[userAddress]) res.status(500).json({ error: 'we could not find your user account' });
  else {
    userInfo[userAddress].push(storeAddress);
    fs.writeFileSync('./server/db.json', JSON.stringify(userInfo));
    res.status(200).send();
  }
});

//
// Upload new content.
//
app.post('/upload', async (req, res) => {
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      files: 1,
      fileSize: process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024, // default to 10mb max upload size
    },
  });

  const response = { fileStreams: {}, otherFields: {} };
  busboy.on('file', async (fieldname, fileStream, origFilename, encoding, mimetype) => {
    response.fileStreams[origFilename] = fileStream;

    const uploadOps = toPairs(response.fileStreams).map(([filename, fileStream]) => {
      // In order to pipe our incoming fileStream into two consumers (raw S3 + ffmpeg->S3), we
      // have to create a PassThrough stream.  It seems that either AWS or ffmpeg is doing
      // something odd when reading the stream that necessitates this.
      const tee = new require('stream').PassThrough();
      fileStream.pipe(tee);

      const previewFilename = `${path.basename(filename, path.extname(filename))}-preview.mp3`;
      const previewFile = ffmpeg(tee)
        .format('mp3')
        .duration(10)
        .pipe();
      return [pipeFileToS3(fileStream, filename, BUCKET_NAME), pipeFileToS3(previewFile, previewFilename, BUCKET_NAME)];
    });
    const responses = await Promise.all(flatten(uploadOps));

    for (const resp of responses) {
      console.log('Uploaded file URL:', resp.Location);
      // @@TODO: store these URLs in the product metadata
    }

    res.status(200).json({ original: responses[0].Location, preview: responses[1].Location });
  });
  busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
    response.otherFields[fieldname] = val;
  });
  busboy.on('finish', () => {
    console.log('finished receiving file uploads');
  });
  req.pipe(busboy);
});

//
// Get files from S3
//
app.get('/stream/:key', async (req, res) => {
  console.log('Getting file from S3', req.params.key);
  const s3 = new AWS.S3({});
  const params = { Bucket: BUCKET_NAME, Key: req.params.key };
  const filepath = `${req.params.key}`;
  const file = fs.createWriteStream(filepath);

  try {
    res.send(
      s3
        .getObject(params)
        .createReadStream()
        .pipe(file),
    );
  } catch (err) {
    console.log('ERROR: ', err);
    res.status(500);
  }
});

//
// Stream the given content.
//
app.get('/content/:contractAddress/:productID', async (req, res) => {
  const { ethAddress } = req.user;
  const { contractAddress, productID } = req.params;

  const randomIndexToPlay = Math.floor(Math.random() * (songs.length - 0)) + 0;

  let productIds = await UjoLicense.getOwnedProductIds(ethAddress, contractAddress, 0);
  productIds = productIds.map(id => id.toString());

  if (productIds.indexOf(productID) === -1) {
    return res.status(403);
  }

  axios({
    method: 'get',
    url: songs[randomIndexToPlay],
    responseType: 'stream',
  }).then(response => {
    response.data.pipe(res);
  });
});

//
// Fetch metadata for the given productID
//
app.get('/metadata/:productID', async (req, res) => {
  const { productID } = req.params;
  const metadata = await redis.getMetadata(productID);
  res.json(metadata);
});

//
// Store metadata for the given productID
//
app.post('/metadata/:productID', async (req, res) => {
  const { productID } = req.params;
  const metadata = await redis.setMetadata(productID, req.body);
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

// Error handler
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
