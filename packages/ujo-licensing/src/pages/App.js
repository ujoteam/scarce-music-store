import React from 'react';
import axios from 'axios'
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Text, Button } from 'rimble-ui';
import ReactAudioPlayer from 'react-audio-player';

import MediaPlayerContainer from '../components/MediaPlayer/MediaPlayerContainer';
import { initWeb3, changeAddress, login } from '../store/storeActions';
import { requestFaucet } from '../fetch'

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
  }

  async componentDidUpdate(prevProps) {
    const { currentAccount } = this.props;
    if (prevProps.accounts !== this.props.accounts && currentAccount) {
      const address = this.account.current.value;
      await this.props.login(currentAccount, this.props.accounts.indexOf(currentAccount));
    }
    requestFaucet();
  }

  async changeAddress() {
    const address = this.account.current.value;
    const jwt = await this.props.login(address, this.props.accounts.indexOf(address));

    console.log('addr jwt ~>', jwt);
    this.props.changeAddress(this.account.current.value, jwt);
    // this.props.history.push('/');
  }

  async onClickUpload(evt) {
    evt.stopPropagation()
    evt.preventDefault()
    const formData = new FormData()
    let i = 0
    for (let file of this.inputFile.current.files) {
        formData.append('uploads' + i, file)
        i++
    }
    // let resp = await axios.post('/upload/0xdeadbeef/1234', formData, {
    //     headers: { 'Content-Type': 'multipart/form-data' },
    // })
    // console.log('resp ~>', resp.data)
    // const { original, preview } = resp.data
    // let contractAddress = '0xdeadbeef'
    // let productID = '1234'
    // resp = await axios.post(`/metadata/${contractAddress}/${productID}`, { tracks: [ { name: 'My track', url: original, preview } ] })
    // console.log('metadata resp ~>', resp)
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
        <MediaPlayerContainer />
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
    },
  )(App),
);
