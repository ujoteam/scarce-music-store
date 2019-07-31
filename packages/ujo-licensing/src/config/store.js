import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunkMiddleware from 'redux-thunk';

import initStates from './initialState';
import combineReducers from './combineReducers';

let store;

if (process.NODE_ENV === 'production') {
  store = (initialState = initStates) => createStore(combineReducers, initialState, applyMiddleware(thunkMiddleware));
} else {
  store = (initialState = initStates) =>
    createStore(combineReducers, initialState, composeWithDevTools(applyMiddleware(thunkMiddleware)));
}

export default store();
