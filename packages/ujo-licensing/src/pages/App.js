/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Text, Button } from 'rimble-ui';

import { initWeb3, changeAddress, login, authenticate } from '../store/storeActions';

export class App extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.account = React.createRef();
  }

  componentWillMount() {
    this.props.initWeb3();
  }

  componentDidMount() {
    const { currentAccount } = this.props;
    this.props.authenticate(currentAccount);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.accounts !== this.props.accounts) {
      this.props.login(this.account.current.value);
    }

    const { currentAccount } = this.props;
    if (prevProps.currentAccount !== currentAccount) {
      this.props.authenticate(currentAccount);
    }
    // const { authenticated } = this.props;
    // if (!prevProps.authenticated && authenticated) {
    //   this.props.history.push('/admin');
    // }
  }

  async changeAddress() {
    const jwt = await this.props.login(this.account.current.value);
    console.log('addr jwt ~>', jwt);
    this.props.changeAddress(this.account.current.value, jwt);
    // this.props.history.push('/');
  }

  render() {
    const { accounts } = this.props;
    return (
      <div>
        <Box style={{ background: 'black' }} p={30}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/">
              <Text fontWeight="bold" color="white">
                [ ujo ]
              </Text>
            </Link>
            <select ref={this.account} onChange={() => this.changeAddress(this.account.current.value)}>
              {accounts.map(add => (
                <option key={add} value={add}>
                  {add}
                </option>
              ))}
            </select>
          </div>
        </Box>
        {this.props.children}
      </div>
    );
  }
}

export default withRouter(
  connect(
    state => ({
      accounts: state.store.getIn(['web3', 'accounts']),
      currentAccount: state.store.get('currentAccount'),
      authenticated: state.store.get('authenticated'),
    }),
    {
      initWeb3,
      changeAddress,
      login,
      authenticate,
    },
  )(App),
);