/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/prefer-stateless-function */
import React from 'react';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

import HomePage from './HomePage';
import AdminPage from './AdminPage';
import DeveloperPage from './DeveloperPage';
import StorePage from './StorePage';
import ReleasePage from './ReleasePage';
import ExternalStorePage from './ExternalStorePage';
import App from './App';

export default class AppRoutes extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <App>
          <Switch>
            <Route exact path="/admin" component={AdminPage} />
            <Route exact path="/developers" component={DeveloperPage} />
            <Route path="/some-store/:storeId" component={ExternalStorePage} />
            <Route path="/admin/store/:storeId" component={StorePage} />
            <Route path="/release" component={ReleasePage} />
            <Route exact path="/" component={HomePage} />
            <Redirect to="/" />
          </Switch>
        </App>
      </BrowserRouter>
    );
  }
}
