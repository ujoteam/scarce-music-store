import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Button, Heading, Text, Table, Loader } from 'rimble-ui';
import { fromJS } from 'immutable';

import { createProduct, getProductsForContract } from '../store/storeActions';
import NewProductForm from '../store/ProductForm';
import ReleaseForm from '../store/ReleaseForm';

export class StorePage extends React.Component {
  componentDidMount() {
    const { licensingContract, currentStore, currentAccount, indexOfAccount } = this.props;
    this.props.getProductsForContract(licensingContract, currentStore, currentAccount, indexOfAccount);
  }

  componentDidUpdate(prevProps) {
    const { currentAccount } = this.props;
    if (prevProps.currentAccount !== currentAccount) {
      this.props.history.push('/admin');
    }
  }

  render() {
    const spinner = this.props.loading ? <Loader size="80px" /> : null;
    const { products, currentStore, licensingContract, match, storeName } = this.props;
    const productKeys = products.keySeq().toArray();
    // needed because immutable holds pointers both integers and numbers
    const uniqueKeys = [];
    productKeys.map(key => {
      const nKey = parseInt(key);
      if (uniqueKeys.indexOf(nKey) < 0) uniqueKeys.push(nKey);
    });
    console.log('uniqueKeys', uniqueKeys);
    return (
      <div>
        <Box p={30}>
          <div style={{ display: 'flex' }}>
            <Heading>Store: {storeName}</Heading>
            <div style={{ flexGrow: 1 }} />
            <Link
              to={`/store/${match.params.storeId}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                float: 'right',
                marginBottom: 20,
              }}
            >
              <Button>View user-facing store</Button>
            </Link>
          </div>
          <br />
          <Text>Click into any of the products for a more detailed description.</Text>

          <Table mb={60}>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Price</th>
                <th>Inventory</th>
                <th>Total Supply</th>
                <th>Total Sold</th>
                <th>Subscription</th>
              </tr>
            </thead>
            <tbody>
              {uniqueKeys.map(key => (
                <tr key={key}>
                  <td>
                    <Link to={`/release/${this.props.match.params.storeId}/${key}`}>
                      <span>{key}</span>
                    </Link>
                  </td>
                  <td>{products.getIn([key, 'price'])}</td>
                  <td>{products.getIn([key, 'inventory'])}</td>
                  <td>
                    {products.getIn([key, 'totalSupply']) === '0' ? 'infinite' : products.getIn([key, 'totalSupply'])}
                  </td>
                  <td>{products.getIn([key, 'totalSold'])}</td>
                  <td>false</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Box>

        <Box p={30} style={{ backgroundColor: '#ececec' }}>
          <Text
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              marginBottom: 16,
            }}
          >
            Create a New Product
          </Text>
          <ReleaseForm
            currentStore={currentStore}
            licensingContractAddress={licensingContract}
            indexOfAccount={this.props.indexOfAccount}
          />
          {/* <NewProductForm currentStore={currentStore} licensingContractAddress={licensingContract} indexOfAccount={this.props.indexOfAccount} /> */}
          <br />
          <br />
          <br />
          <br />

          <div id="spinner">{spinner}</div>

          {/* {this.props.stores.map(add => (
          <Link key={add} to={`/admin/store/${add}`}>
            <Box>
              <Heading>Store Id: {add}</Heading>
            </Box>
          </Link>
        ))} */}
        </Box>
      </div>
    );
  }
}

export default withRouter(
  connect(
    (state, props) => {
      const currentAccount = state.store.get('currentAccount');
      const storeInfo = state.store.getIn(['stores', props.match.params.storeId]);
      const accounts = state.store.getIn(['web3', 'accounts']);
      return {
        products: storeInfo && storeInfo.get('products') ? storeInfo.get('products') : fromJS({}),
        accounts: state.store.getIn(['web3', 'accounts']),
        currentAccount,
        licensingContract: storeInfo ? storeInfo.get('LicenseInventory') : null,
        storeName: storeInfo ? storeInfo.get('name') : null,
        // stores: contracts.length ? contracts : [],
        currentStore: props.match.params.storeId,
        accounts,
        indexOfAccount: accounts.indexOf(currentAccount),
        downloading: state.store.get('downloading'),
        loading: state.store.get('loading'),
      };
    },
    {
      createProduct,
      getProductsForContract,
    },
  )(StorePage),
);
