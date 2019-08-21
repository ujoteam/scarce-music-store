import React from 'react';
import { fromJS } from 'immutable';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Button, Heading, Text, EthAddress, Form } from 'rimble-ui';

import Jdenticon from '../components/Utils/Jdenticon';
import { initWeb3, getUserStoreContracts, deployStore } from '../store/storeActions';

import './AdminPage.css'

export class AdminPage extends React.Component {
  constructor(props) {
    super(props);
    this.storeName = React.createRef();
  }

  render() {
    const indexOfAccount = this.props.accounts.indexOf(this.props.currentAccount);

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
        {this.props.stores.map(addses => (
          <Link
            key={addses.get('LicenseSale')}
            to={`/admin/store/${addses.get('id')}`}
            style={{ textDecoration: 'none', color: 'black' }}
          >
            <span>{addses.get('name')}</span>
            <Box
              className="store"
              style={{
                border: '1px solid rgb(218, 218, 218)',
                marginTop: 40,
                display: 'flex',
                padding: 16,
                borderRadius: 5,
              }}
            >
              <Jdenticon seed={addses.get('LicenseSale')} size={64} style={{ marginRight: 16 }} />
              <Heading>{addses.get('name')}</Heading>
              <span>Store Id: </span>
              <EthAddress truncate address={addses.get('LicenseSale')} />
            </Box>
          </Link>
        ))}

        <br />
        <br />
        <br />
        <br />
        <Form.Input type="text" required ref={this.storeName} placeholder="Store Name" width={1} />
        <Button onClick={() => this.props.deployStore(this.props.currentAccount, indexOfAccount, this.storeName.current.value)}>Deploy A New Store</Button>
      </Box>
    );
  }
}

export default connect(
  state => {
    const currentAccount = state.store.get('currentAccount');
    const contracts = state.store.getIn(['stores', currentAccount]);
    return {
      accounts: state.store.getIn(['web3', 'accounts']),
      currentAccount,
      stores: currentAccount && contracts ? contracts : fromJS({}),
    };
  },
  {
    initWeb3,
    getUserStoreContracts,
    deployStore,
  },
)(AdminPage);
