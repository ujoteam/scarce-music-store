const storeInitialState = {
  authenticated: false,
  currentAccount: null,
  jwt: window.localStorage.getItem('jwt'),
  stores: {},
  web3: {
    accounts: [],
  },
  purchases: {},
};

export default storeInitialState;

