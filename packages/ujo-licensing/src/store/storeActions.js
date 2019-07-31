import axios from 'axios';
import LicensingHelper from '../../UjoLicensingClass';
import * as fetch from '../fetch';

const ethUtil = require('ethereumjs-util');

const serverAddress = 'http://localhost:3001';

let UjoLicensing;

// actions
export const initWeb3 = () => async dispatch => {
  UjoLicensing = new LicensingHelper();
  UjoLicensing.init();
  // use Metamask, et al. if available
  // If no injected web3 instance is detected, fallback to Ganache CLI.
  // TODO fix hard-coding to ganache-cli web3
  // const provider = (web3 !== undefined) ? web3.currentProvider : new Web3.providers.HttpProvider('http://127.0.0.1:8545');
  const accounts = await UjoLicensing.web3.eth.getAccounts();
  console.log('accounts', accounts);
  dispatch({
    type: 'WEB3_INIT',
    accounts,
  });
};

// TODO - Do we need this method?
export const verifyOwnership = (contractAddress, signature, productId, address) => async dispatch => {
  console.log(contractAddress);
  // TODO - This is a hack and should happen elsewhere
  const sig = await UjoLicensing.signData(productId, address);

  // get address from sig
  const add = UjoLicensing.recoverAddressFromSignedData(productId, sig);

  // check token balance in contract to see if
  let res;
  try {
    res = await axios.get(`${serverAddress}/auth/${productId}/${sig}/${contractAddress}`);
    const { data } = res;
    console.log(data);
  } catch (error) {
    console.log(error);
  }

  // Check if signer is the same
  if (res.data === add.toLowerCase()) {
    console.log('Success!');
  } else {
    console.log('Denied!');
  }
};

export const getTokensForAddressFromContract = (address, contractAddress) => async dispatch => {
  const productIds = await UjoLicensing.getOwnedProductIds(address, contractAddress);

  dispatch({
    type: 'GET_PURCHASES',
    address,
    contractAddress,
    productIds,
  });
};

export const buyProduct = (productId, contractAddress, address) => async dispatch => {
  const licenseId = await UjoLicensing.buyProduct(productId, address, contractAddress);
  dispatch({
    type: 'PRODUCT_PURCHASE',
    address,
    contractAddress,
    productId,
  });
};

export const changeAddress = (newAddress, jwt) => ({
  type: 'CHANGED_ADDRESS',
  newAddress,
  jwt,
});

export const deployStore = address => async dispatch => {
  const contractAddress = await UjoLicensing.deployNewStore(address);

  // Update address on server
  let res;
  try {
    // should add a new contract to the user
    res = await axios.post(`${serverAddress}/deploy-store`, { address, contractAddress });
    dispatch({
      type: 'DEPLOY_STORE',
      address,
      contractAddress,
    });
  } catch (error) {
    console.log(error);
  }
  console.log(res);
};

export const login = ethAddress => async dispatch => {
  try {
    const resp = await fetch.getLoginChallenge(ethAddress);

    const challenge = resp.data.challenge[1].value;
    const signature = await UjoLicensing.signData(challenge, ethAddress);

    const jwt = await fetch.login(challenge, signature);
    return jwt;
  } catch (err) {
    console.log('/login error:', err);
  }
};

export const authenticate = address => async dispatch => {
  let res;
  try {
    // should add a new contract to the user
    res = await axios.post(`${serverAddress}/auth`, { address });
    dispatch({
      type: 'AUTH_USER',
      address,
      contractAddresses: res.data,
    });
  } catch (error) {
    console.log(error);
  }
  console.log(res);
};

export const getProductsForContract = contractAddress => async dispatch => {
  const { productIds, productData, soldData } = await UjoLicensing.getProductsForContract(contractAddress);

  dispatch({
    type: 'STORE_PRODUCT_INFO',
    contractAddress,
    productIds,
    productData,
    soldData,
  });
};

export const createProduct = (productId, price, inventory, address, contractAddress) => async dispatch => {
  const product = await UjoLicensing.createProduct(productId, price, inventory, address, contractAddress);
  console.log(product);

  dispatch({
    type: 'ADD_NEW_PRODUCT',
    contractAddress,
    productId,
    product,
  });
};
