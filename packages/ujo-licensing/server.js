const express = require('express');
const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');
const bodyParser = require('body-parser');
const MetaAuth = require('./meta-auth');
const LicenseContract = require('./src/LicenseCore.json');

let contractAddress;
let accounts;
let currentNetwork;
let web3;

// development
if (process.env.NODE_ENV !== 'production') {
  // contractAddress = '';
  web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
} else {
  // production
  // contractAddress = '';
  const mnemonic = process.env.MNEMONIC;
  const infuraApi = process.env.INFURA_API;
  web3 = new Web3(new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/${infuraApi}`));
}

const port = process.env.PORT || '3001';
const app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const metaAuth = new MetaAuth({
  banner: 'Ujo Licensing',
});

app.use('/', express.static('.'));
app.get('/auth/:MetaAddress', metaAuth, (req, res) => {
  // Request a message from the server
  if (req.metaAuth && req.metaAuth.challenge) {
    res.send(req.metaAuth.challenge);
  }
});

app.post('/update-address', (req, res) => {
  console.log('Updating contract address', req.body.address);
  contractAddress = req.body.address;
  res.status(200).send();
});

app.get('/auth/:MetaMessage/:MetaSignature', metaAuth, (req, res) => {
  if (req.metaAuth && req.metaAuth.recovered) {
    console.log('Checking if account owns the token');

    // TODO - This probably shouldn't be in this route
    // Figure out how to handle updating the contract address
    const ContractInstance = new web3.eth.Contract(LicenseContract.abi, contractAddress);

    // Check whether this user has a valid ERC721 token
    const balance = ContractInstance.methods
      .balanceOf(req.metaAuth.recovered)
      .call()
      .then(result => {
        // Authentication is valid, assign JWT, etc.
        console.log(result.toString());
        result = web3.utils.toBN(result);
        if (result.gt(0)) res.send(req.metaAuth.recovered);
        // Authentication fail, no subscription token
        else res.status(400).send();
      });
  } else {
    // Sig did not match, invalid authentication
    res.status(400).send();
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
