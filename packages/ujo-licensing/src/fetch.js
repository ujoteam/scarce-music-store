
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

export const requestFaucet = async () => {
  const resp = await axios.get(`${serverAddress}/faucet`, { headers: getHeaders() })
  console.log('faucet resp ~>', resp.data)
}

