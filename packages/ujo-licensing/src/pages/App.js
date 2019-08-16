/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import axios from 'axios'
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Text, Button } from 'rimble-ui';

import { initWeb3, changeAddress, login, authenticate } from '../store/storeActions';

export class App extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.account = React.createRef();
    this.inputFile = React.createRef();
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
      const address = this.account.current.value;
      this.props.login(address, this.props.accounts.indexOf(address));
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
    const address = this.account.current.value;
    const jwt = await this.props.login(address, this.props.accounts.indexOf(address));

    console.log('addr jwt ~>', jwt);
    this.props.changeAddress(this.account.current.value, jwt);
    // this.props.history.push('/');
  }

  async onClickUpload() {
    const formData = new FormData()
    console.log('file ~>', this.inputFile.current.files[0])
    formData.append('user-photo', this.inputFile.current.files[0])
    const resp = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    console.log('resp ~>', resp.data)
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
          <form action="/upload" method="post">
              <input type="file" ref={this.inputFile} />
              <button onClick={() => this.onClickUpload()}>Upload</button>
          </form>
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
