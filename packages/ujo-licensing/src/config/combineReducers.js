import { combineReducers } from 'redux';
import storeReducer from '../store/reducer';

const reducer = combineReducers({
  store: storeReducer,
});

export default reducer;
