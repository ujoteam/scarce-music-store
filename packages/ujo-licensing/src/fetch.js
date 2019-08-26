import axios from 'axios';
import createZip from './components/Utils/jszip';

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
  axios.get(`/login/${ethAddress}`, { headers: getHeaders() });

export const setJWT = incomingJWT => {
  jwt = incomingJWT;
};

export const login = async (challenge, signature, ethAddress) => {
  const resp2 = await axios.get(`/login/${challenge}/${signature}`, { headers: getHeaders() });
  jwt = resp2.data.jwt;
  window.localStorage.setItem(`jwt-${ethAddress}`, jwt);
  return jwt;
};

export const deployStore = storeData => axios.post(`/stores`, storeData, { headers: getHeaders() });

export const getUserStoreContracts = () => axios.get(`/stores?mine=1`, { headers: getHeaders() });

export const getAllStoreContracts = () => axios.get(`/stores`, { headers: getHeaders() });

export const uploadContent = async (files, storeId, productId) => {
  console.log(files);
  const formData = new FormData();
  files.forEach((file, i) => {
    formData.append(`track-${i}`, file);
  });

  const contentLocations = await axios.post(`/upload/${storeId}/${productId}`, formData, {
    headers: {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  console.log(contentLocations);
  return contentLocations.data;
};

export const requestFaucet = async () => {
  const resp = await axios.get(`/faucet`, { headers: getHeaders() });
  console.log('faucet resp ~>', resp.data);
};

export const downloadFiles = async (storeId, releaseId, artistName, releaseName, tracks) => {
  const zipItUp = await createZip(storeId, releaseId, artistName, releaseName, tracks, jwt);
}