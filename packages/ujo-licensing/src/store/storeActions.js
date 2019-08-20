import { ethers } from 'ethers'
import axios from 'axios';
import LicensingHelper from '../../UjoLicensingClass';
import * as fetch from '../fetch';

const serverAddress = 'http://localhost:3001';

let UjoLicensing;

// actions
export const initWeb3 = () => async dispatch => {
  let provider
  let accounts
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    accounts = await window.ethereum.enable()
  } else {
    throw new Error(`We haven't implemented anything but Metamask yet`)
  }

  UjoLicensing = new LicensingHelper(provider);

  console.log('accounts', accounts);
  dispatch({
    type: 'WEB3_INIT',
    accounts,
  });
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

export const buyProduct = (productId, contractAddress, address, indexOfAccount) => async dispatch => {
  const licenseId = await UjoLicensing.buyProduct(productId, address, contractAddress, indexOfAccount);
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

export const deployStore = (address, indexOfAccount) => async dispatch => {
  const contractAddresses = await UjoLicensing.deployNewStore(address, indexOfAccount);

  // Update address on server
  let res;
  try {
    // should add a new contract to the user
    res = await axios.post(`${serverAddress}/deploy-store`, { address, contractAddresses });
    dispatch({
      type: 'DEPLOY_STORE',
      address,
      contractAddresses,
    });
  } catch (error) {
    console.log(error);
  }
  console.log(res);
};

export const login = (ethAddress, index) => async dispatch => {
  try {
    const resp = await fetch.getLoginChallenge(ethAddress);

    const challenge = resp.data.challenge[1].value;
    const signature = await UjoLicensing.signData(challenge, index);

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

export const createProduct = (
  productId,
  price,
  inventory,
  address,
  contractAddress,
  indexOfAccount,
) => async dispatch => {
  const product = await UjoLicensing.createProduct(
    productId,
    price,
    inventory,
    address,
    contractAddress,
    indexOfAccount,
  );
  console.log(product);

  dispatch({
    type: 'ADD_NEW_PRODUCT',
    contractAddress,
    productId,
    product,
  });
};

const uploadContent = async file => {
  const formData = new FormData();
  console.log('file ~>', file);
  formData.append('track', file);
  const headers = { 'Content-Type': 'multipart/form-data' };

  const trackLocations = await axios.post(`${serverAddress}/upload`, formData, { headers });
  return trackLocations.data;
};

export const createScarceRelease = (releaseInfo, currentAccount, contractAddress, indexOfAccount) => async dispatch => {
  // TODO: add fault tolerance
  // content
  const trackLocations = await Promise.all(releaseInfo.tracks.map(async track => uploadContent(track.file)));
  console.log('trackLocations', trackLocations);

  releaseInfo.tracks = releaseInfo.tracks.map((track, i) => ({
    name: track.name,
    url: trackLocations[i].original,
    preview: trackLocations[i].preview,
  }));

  // metadata
  console.log('releaseInfo', releaseInfo);
  const random = Math.floor(Math.random() * 1000000000);
  const res = await axios.post(`${serverAddress}/metadata/${contractAddress}/${random}`, releaseInfo);

  // check metadata
  const resp = await axios.get(`${serverAddress}/metadata/${contractAddress}/${random}`);

  console.log('METADATA: ', resp.data);

  // contract
  const product = await UjoLicensing.createProduct(
    random,
    releaseInfo.price,
    releaseInfo.inventory,
    currentAccount,
    contractAddress,
    indexOfAccount,
  );
  console.log(product);

  dispatch({
    type: 'ADD_NEW_PRODUCT',
    contractAddress,
    productId: random,
    product,
  });
};
