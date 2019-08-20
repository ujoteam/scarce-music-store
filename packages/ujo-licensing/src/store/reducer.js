/* eslint-disable no-return-assign */
import { fromJS } from 'immutable';

import initialState from './initialState';

const reducer = (state = fromJS(initialState), action) => {
  switch (action.type) {
    case 'DEFAULT':
      return state;
    case 'WEB3_INIT':
      return state.setIn(['web3', 'accounts'], action.accounts).set('currentAccount', action.accounts[0]);
    case 'AUTH_USER':
      console.log('action.contractAddresses', action.contractAddresses);
      return state.set('authenticated', true).update('stores', (v = fromJS({})) => {
        v = v.update(action.address, (val = fromJS({})) => {
          action.contractAddresses.map(add => {
            val = val.set(add, fromJS({}));
          });
          return val;
        });
        return v;
      });
    case 'DEPLOY_STORE':
      return state.setIn(['stores', action.address, action.contractAddresses], fromJS({}));
    case 'ADD_NEW_PRODUCT':
      return state.updateIn(
        ['stores', action.contractAddresses],
        v => v.set(action.productId, fromJS(Object.assign(action.product, { totalSold: 0 }))),
        // v.push(Object.assign(action.product, { id: action.productId })),
      );
    case 'CHANGED_ADDRESS':
      return (
        state
          .set('authenticated', false)
          // .set('stores', fromJS({}))
          .set('currentAccount', action.newAddress)
          .set('jwt', action.jwt)
          .update('purchases', v => v.map((val, k) => fromJS([])))
      );
    case 'STORE_PRODUCT_INFO':
      return state.updateIn(['stores', action.contractAddress], (v = fromJS({})) => {
        action.productIds.map((id, i) => {
          v = v.set(id, fromJS(Object.assign({}, action.productData[i]))); // needed because web3 returns a 'Result' object??
          v = v.setIn([id, 'totalSold'], action.soldData[i]);
          return v;
        });
        return v;
      });
    case 'GET_PURCHASES':
      return state.setIn(['purchases', action.contractAddress], fromJS(action.productIds));
    case 'PRODUCT_PURCHASE':
      return state.updateIn(['purchases', action.contractAddress], (v = fromJS([])) => v.push(action.productId));
    case 'VERIFY_OWNERSHIP':
      // return state.updateIn(['purchases', action.contractAddress], (v = fromJS([])) => v.push(action.verified));
      return state;
    default:
      return state;
  }
};

export default reducer;
