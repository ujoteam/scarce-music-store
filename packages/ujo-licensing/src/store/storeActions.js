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
    res = await fetch.deployStore(contractAddresses);
    // res = await axios.post(`${serverAddress}/stores`, { contractAddresses });
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

export const login = (address, index) => async dispatch => {
  try {
    const jwt = window.localStorage.getItem(`jwt-${address}`);
    if (jwt) fetch.setJWT(jwt);
    else {
      const resp = await fetch.getLoginChallenge(address);
      const challenge = resp.data.challenge[1].value;
      const signature = await UjoLicensing.signData(challenge, index);
      await fetch.login(challenge, signature, address);
    }

    // get contracts
    const res = await fetch.getUserStoreContracts()
    dispatch({
      type: 'AUTH_USER',
      address,
      contractAddresses: res.data,
    });
  } catch (err) {
    console.log('/login error:', err);
  }
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
  return fetch.uploadContent(files, storeId, productId)
};

export const createScarceRelease = (releaseInfo, currentAccount, contractAddress, storeId, indexOfAccount) => async dispatch => {
  // create random ID for storage purposes
  const random = Math.floor(Math.random() * 1000000000);
  // TODO: add fault tolerance
  // content
  console.log('releaseInfo', releaseInfo);
  const files = [];
  files.push(releaseInfo.releaseImage)
  releaseInfo.tracks.map(track => { files.push(track.file) });
  console.log('files', files);
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

export const getReleaseInfo = (releaseId, storeId) => async dispatch => {
  const res = await axios.get(`${serverAddress}/metadata/${storeId}/${releaseId}`);
  const resp = await axios.get(`${serverAddress}/stores?storeID=${storeId}`);
  const storeInfo = resp.data;

  const releaseContractInfo = await UjoLicensing.getProductInfoForContract(storeInfo.LicenseInventory, releaseId);
  releaseContractInfo.productData.totalSold = releaseContractInfo.soldData;
  dispatch({
    type: 'RELEASE_INFO',
    releaseInfo: res.data,
    releaseId,
    storeId,
    releaseContractInfo: releaseContractInfo.productData,
    releaseContracts: resp.data,
  });
};
