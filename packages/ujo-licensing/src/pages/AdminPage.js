/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Button, Heading, Text, Form, EthAddress } from 'rimble-ui';
import Jdenticon from './Jdenticon';

import { initWeb3, authenticate, deployStore, createProduct, getProductsForContract } from '../store/storeActions';

import './AdminPage.css'

export class AdminPage extends React.Component {
  componentDidMount() {
    // this.props.initWeb3();
  }

  render() {
    return (
      <Box p={30}>
        <Heading>Welcome to the tour</Heading>
        <Text>
          The licensing portal allows you easily deploy an Ethereum store and enable your business to attach licensing
          policies to.
        </Text>
        <Text>
          It is also possible to launch multiple stores that manage various types of products your business offers.
        </Text>
        <Text>See below all the stores you have launched.</Text>
        <Text>Click into any of the stores to see the list of products and their respective information.</Text>

        <br />
        <br />
        <br />
        {this.props.stores.map(add => (
          <Link key={add} to={`/admin/store/${add}`} style={{ textDecoration: 'none', color: 'black' }}>
            <Box style={{
                border: '1px solid rgb(218, 218, 218)',
                marginTop: 40,
                display: 'flex',
                padding: 16,
                borderRadius: 5,
            }} className="store">
              <Jdenticon seed={add} size={64} style={{ marginRight: 16 }} />
              <Heading>
                Store Id:
                <EthAddress truncate address={add} />
              </Heading>
            </Box>
          </Link>
        ))}

        <br />
        <br />
        <br />
        <br />

        <Button onClick={() => this.props.deployStore(this.props.currentAccount)}>Deploy A New Store</Button>
      </Box>
    );
  }
}

export default connect(
  state => {
    const currentAccount = state.store.get('currentAccount');
    let contracts = currentAccount ? state.store.getIn(['stores', currentAccount]) : null;
    contracts = contracts ? contracts.keySeq().toArray() : [];
    return {
      accounts: state.store.getIn(['web3', 'accounts']),
      currentAccount,
      stores: contracts.length ? contracts : [],
    };
  },
  {
    initWeb3,
    authenticate,
    deployStore,
    createProduct,
    getProductsForContract,
  },
)(AdminPage);
