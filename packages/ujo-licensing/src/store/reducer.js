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
      return state.set('authenticated', true)
        .update('stores', (v = fromJS({})) => {
          action.contractAddresses.map(addses => {
            v = v.set(addses.id.toString(), fromJS(addses));
          });
          return v;
        })
        .update('userStores', (v = fromJS({})) => {
          v = v.update(action.address, (val = fromJS([])) => {
            action.contractAddresses.map(addses => {
              val = val.push(addses.id); //set(addses.id, fromJS(addses));
            });
            return val;
          });
          return v;
        });
    case 'DEPLOY_STORE':
      return state.setIn(['stores', action.contractAddresses.id], fromJS(action.contractAddresses))
                  .updateIn(['userStores', action.address], (v = fromJS([])) => v.push(action.contractAddresses.id)); //fromJS(action.contractAddresses));
    case 'ADD_NEW_PRODUCT':
      return state.updateIn(
        ['stores', action.storeId, 'products'],
        (v = fromJS({})) => {
          v = v.set(action.productId, fromJS(Object.assign(action.product, { totalSold: 0 })))
               .setIn([action.productId, 'id'], action.productId)
          return v;
        },
        // v.push(Object.assign(action.product, { id: action.productId })),
      );
    case 'CHANGED_ADDRESS':
      return (
        state
          .set('authenticated', false)
          .set('currentAccount', action.newAddress)
          .set('jwt', action.jwt)
          .update('purchases', v => v.map((val, k) => fromJS([])))
      );
    case 'STORE_PRODUCT_INFO':
      return state.updateIn(['stores', action.storeId, 'products'], (v = fromJS({})) => {
        action.productIds.map((id, i) => {
          v = v.update(id, (val = fromJS({})) => val.merge(fromJS(Object.assign({}, action.productData[i])))); // needed because web3 returns a 'Result' object??
          v = v.setIn([id, 'totalSold'], action.soldData[i]);
          v = v.setIn([id, 'id'], id);
          return v;
        });
        return v;
      });
    case 'GET_PURCHASES':
      return state.setIn(['purchases', action.contractAddress], fromJS(action.productIds));
    case 'PRODUCT_PURCHASE':
      return state.updateIn(['purchases', action.storeId], (v = fromJS([])) => v.push(action.productId))
                  .setIn(['stores', action.storeId, 'products', action.productId, 'owned'], true);
    case 'VERIFY_OWNERSHIP':
      // return state.updateIn(['purchases', action.contractAddress], (v = fromJS([])) => v.push(action.verified));
      return state;
    case 'RELEASE_INFO':
      return state.updateIn(['stores', action.storeId], (v = fromJS({})) => v.merge(fromJS(action.releaseContracts)))
                  .updateIn(['stores', action.storeId, 'products', action.releaseId], (v = fromJS({})) => v.merge(fromJS(action.releaseInfo)))
                  .updateIn(['stores', action.storeId, 'products', action.releaseId], (v = fromJS({})) => v.merge(fromJS(action.releaseContractInfo)))
                  .setIn(['stores', action.storeId, 'products', action.releaseId, 'id'], action.releaseId)
                  .setIn(['stores', action.storeId, 'products', action.releaseId, 'owned'], action.owned || false)
    case 'DOWNLOADING':
      return state.set('downloading', true);
    case 'DOWNLOADED':
      return state.set('downloading', false);
    default:
      return state;
  }
};

export default reducer;
