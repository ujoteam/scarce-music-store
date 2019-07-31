import '@babel/polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// import AppRoutes from './pages';
import store from './config/store';
import AppRoutes from './pages';
import './styles/main.css';

ReactDOM.render(
  <Provider store={store}>
    <AppRoutes />
  </Provider>
  , document.getElementById('root'),
);
