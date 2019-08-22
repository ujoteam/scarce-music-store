
import axios from 'axios'

export let jwt = window.localStorage.getItem('jwt')
const serverAddress = 'http://localhost:3001'

function getHeaders() {
  if (jwt) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    }
  } else {
    return {
      'Content-Type': 'application/json',
    }
  }
}

export const getLoginChallenge = (ethAddress) => {
  return axios.get(`${serverAddress}/login/${ethAddress}`, { headers: getHeaders() })
}

export const login = async (challenge, signature) => {
  const resp2 = await axios.get(`${serverAddress}/login/${challenge}/${signature}`, { headers: getHeaders() })
  jwt = resp2.data.jwt
  window.localStorage.setItem('jwt', jwt)
  return jwt
}

export const deployStore = (storeData) => {
  return axios.post(`${serverAddress}/stores`, storeData, { headers: getHeaders() });
}

export const getUserStoreContracts = () => {
  return axios.get(`${serverAddress}/stores?mine=1`, { headers: getHeaders() })
}

export const getAllStoreContracts = () => {
  return axios.get(`${serverAddress}/stores`, { headers: getHeaders() })
}

export const uploadContent = async (files, storeId, productId) => {
  const formData = new FormData();
  files.forEach((file, i) => {
    formData.append(`track-${i}`, file);
  });

  const trackLocations = await axios.post(`${serverAddress}/upload/${storeId}/${productId}`, formData, {
    headers: {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data',
    },
  });
  return trackLocations.data;
}

export const requestFaucet = async () => {
  const resp = await axios.get(`${serverAddress}/faucet`, { headers: getHeaders() })
  console.log('faucet resp ~>', resp.data)
}

