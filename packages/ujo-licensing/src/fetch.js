import axios from 'axios';
import createZip from './components/Utils/jszip';
import { API_ENDPOINT } from './config/endpoints';

export let jwt;


function getHeaders() {
  if (jwt) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    };
  }
  return {
    'Content-Type': 'application/json',
  };
}

export const getLoginChallenge = ethAddress =>
  axios.get(`${API_ENDPOINT}/login/${ethAddress}`, { headers: getHeaders() });

export const setJWT = incomingJWT => {
  jwt = incomingJWT;
};

export const login = async (challenge, signature, ethAddress) => {
  const resp2 = await axios.get(`${API_ENDPOINT}/login/${challenge}/${signature}`, { headers: getHeaders() });
  jwt = resp2.data.jwt;
  window.localStorage.setItem(`jwt-${ethAddress}`, jwt);
  return jwt;
};

export const deployStore = storeData => axios.post(`${API_ENDPOINT}/stores`, storeData, { headers: getHeaders() });

export const getUserStoreContracts = () => axios.get(`${API_ENDPOINT}/stores?mine=1`, { headers: getHeaders() });

export const getAllStoreContracts = () => axios.get(`${API_ENDPOINT}/stores`, { headers: getHeaders() });

export const uploadContent = async (files, storeId, productId) => {
  console.log(files);
  const formData = new FormData();
  files.forEach((file, i) => {
    formData.append(`track-${i}`, file);
  });

  const contentLocations = await axios.post(`${API_ENDPOINT}/upload/${storeId}/${productId}`, formData, {
    headers: {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  console.log(contentLocations);
  return contentLocations.data;
};

export const requestFaucet = async () => {
  const resp = await axios.get(`${API_ENDPOINT}/faucet`, { headers: getHeaders() });
  console.log('faucet resp ~>', resp.data);
};

export const downloadFiles = async (storeId, releaseId, artistName, releaseName, tracks) => {
  const zipItUp = await createZip(storeId, releaseId, artistName, releaseName, tracks, jwt);
}