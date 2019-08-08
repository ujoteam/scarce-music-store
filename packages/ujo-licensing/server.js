const express = require('express');
const Ethers = require('ethers');
const HDWalletProvider = require('truffle-hdwallet-provider');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');

const MetaAuth = require('./meta-auth');
// const LicenseContract = require('./UjoLicensingClass/LicenseCore.json');
const UjoLicensing = require('./dist/UjoLicensingClass');

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

app.get('/login/:MetaAddress', metaAuth, (req, res) => {
  // Request a message from the server
  if (req.metaAuth && req.metaAuth.challenge) {
    res.send({ challenge: req.metaAuth.challenge });
  } else {
    res.status(500).send();
  }
});

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

app.post('/auth', (req, res) => {
  const userAddress = req.body.address;

  try {
    if (fs.existsSync('./server/db.json')) {
      const cont = fs.readFileSync('./server/db.json', 'utf8');
      let userInfo = JSON.parse(cont);
      userInfo = Object.assign({}, userInfo); // not sure why I need this

      if (userInfo[userAddress]) res.json(userInfo[userAddress]);
      else {
        userInfo[userAddress] = [];
        fs.writeFileSync('./server/db.json', JSON.stringify(userInfo));
        res.json(userInfo[userAddress]);
      }
    } else {
      const userInfo = {};
      userInfo[userAddress] = [];
      fs.mkdir('./server', err => {
        if (err) throw err;
        fs.writeFileSync('./server/db.json', JSON.stringify(userInfo));
        res.json(userInfo[userAddress]);
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

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

app.get('/auth/:MetaAddress', metaAuth, (req, res) => {
  // Request a message from the server
  if (req.metaAuth && req.metaAuth.challenge) {
    res.send(req.metaAuth.challenge);
  } else {
    res.status(500);
  }
});

app.post('/update-address', (req, res) => {
  console.log('Updating contract address', req.body.address);
  contractAddress = req.body.address;
  res.status(200).send();
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
