import axios from 'axios';

export let jwt;
const serverAddress = 'http://localhost:3001';

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
  axios.get(`${serverAddress}/login/${ethAddress}`, { headers: getHeaders() });

export const setJWT = incomingJWT => {
  jwt = incomingJWT;
};

export const login = async (challenge, signature, ethAddress) => {
  const resp2 = await axios.get(`${serverAddress}/login/${challenge}/${signature}`, { headers: getHeaders() });
  jwt = resp2.data.jwt;
  window.localStorage.setItem(`jwt-${ethAddress}`, jwt);
  return jwt;
};

export const deployStore = storeData => axios.post(`${serverAddress}/stores`, storeData, { headers: getHeaders() });

export const getUserStoreContracts = () => axios.get(`${serverAddress}/stores?mine=1`, { headers: getHeaders() });

export const getAllStoreContracts = () => axios.get(`${serverAddress}/stores`, { headers: getHeaders() });

export const uploadContent = async (files, storeId, productId) => {
  console.log(files);
  const formData = new FormData();
  files.forEach((file, i) => {
    formData.append(`track-${i}`, file);
  });

  const contentLocations = await axios.post(`${serverAddress}/upload/${storeId}/${productId}`, formData, {
    headers: {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  console.log(contentLocations);
  return contentLocations.data;
};

export const requestFaucet = async () => {
  const resp = await axios.get(`${serverAddress}/faucet`, { headers: getHeaders() });
  console.log('faucet resp ~>', resp.data);
};
