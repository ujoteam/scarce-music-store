const storeInitialState = {
  authenticated: false,
  currentAccount: null,
  jwt: window.localStorage.getItem('jwt'),
  stores: {},
  web3: {
    accounts: [],
  },
  purchases: {},
  releases: {},
  downloading: false,
};

export default storeInitialState;

