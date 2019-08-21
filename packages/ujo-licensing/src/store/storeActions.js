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

export const deployStore = (address, indexOfAccount, name) => async dispatch => {
  const contractAddresses = await UjoLicensing.deployNewStore(address, indexOfAccount);
  const random = Math.floor(Math.random() * 1000000000);
  contractAddresses.id = random.toString();
  contractAddresses.name = name;
  // Update address on server
  let res;
  try {
    // should add a new contract to the user
    res = await fetch.postContactAddresses(contractAddresses);
    // res = await axios.post(`${serverAddress}/stores`, { contractAddresses });
    dispatch({
      type: 'DEPLOY_STORE',
      address,
      contractAddresses,
      name,
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

export const getUserStoreContracts = address => async dispatch => {
  let res;
  try {
    // should add a new contract to the user
    res = await fetch.getUserStoreContracts()
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

export const getProductsForContract = (contractAddress, storeId, ethAddress) => async dispatch => {
  const { productIds, productData, soldData } = await UjoLicensing.getProductsForContract(contractAddress);

  dispatch({
    type: 'STORE_PRODUCT_INFO',
    contractAddress,
    productIds,
    productData,
    soldData,
    storeId,
    ethAddress,
  });
};

export const createProduct = (
  productId,
  price,
  inventory,
  address,
  storeId,
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
    storeId,
    productId,
    product,
  });
};

const uploadContent = async (files, storeId, productId) => {
  const formData = new FormData();
  // formData.append('track', file);
  files.map((file, i) => {
    console.log('file ~>', file);
    formData.append(`track-${i}`, file);
  });
  const headers = { 'Content-Type': 'multipart/form-data' };

  const trackLocations = await axios.post(`${serverAddress}/upload/${storeId}/${productId}`, formData, { headers });
  return trackLocations.data;
};

export const createScarceRelease = (releaseInfo, currentAccount, contractAddress, storeId, indexOfAccount) => async dispatch => {
  // create random ID for storage purposes
  const random = Math.floor(Math.random() * 1000000000);
  // TODO: add fault tolerance
  // content
  const files = [];
  releaseInfo.tracks.map(track => { files.push(track.file) });
  const trackLocations = await uploadContent(files, storeId, random);
  // const trackLocations = await Promise.all(releaseInfo.tracks.map(async track => uploadContent(track.file, storeId, random)));
  console.log('trackLocations', trackLocations);

  releaseInfo.tracks = releaseInfo.tracks.map((track, i) => ({
    name: track.name,
    // url: trackLocations[i].original,
    // preview: trackLocations[i].preview,
  }));

  // metadata
  console.log('releaseInfo', releaseInfo);
  const res = await axios.post(`${serverAddress}/metadata/${storeId}/${random}`, releaseInfo);

  // // check metadata
  // const resp = await axios.get(`${serverAddress}/metadata/${contractAddress}/${random}`);
  // console.log('METADATA: ', resp.data);

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
    currentAccount,
    storeId,
  });
};

export const getReleaseInfo = (releaseId, contractAddress) => async dispatch => {
  const res = await axios.get(`${serverAddress}/metadata/${contractAddress}/${releaseId}`);
  dispatch({
    type: 'RELEASE_INFO',
    releaseInfo: res.data,
    releaseId,
  });
};
