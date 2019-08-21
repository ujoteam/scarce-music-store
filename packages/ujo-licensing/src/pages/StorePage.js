import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Button, Heading, Text, Table } from 'rimble-ui';
import { fromJS } from 'immutable';

import { createProduct, getProductsForContract } from '../store/storeActions';
import NewProductForm from '../store/ProductForm';
import ReleaseForm from '../store/ReleaseForm';

export class StorePage extends React.Component {
  componentWillMount() {
    this.props.getProductsForContract(this.props.match.params.storeId, this.props.indexOfAccount);
  }

  componentDidUpdate(prevProps) {
    const { currentAccount } = this.props;
    if (prevProps.currentAccount !== currentAccount) {
      this.props.history.push('/admin');
    }
  }

  render() {
    const { products, currentStore, match } = this.props;
    const productKeys = products.keySeq().toArray();
    return (
      <Box p={30}>
        <div style={{ display: 'flex' }}>
          <Heading>
Store
{' '}
{match.params.storeId.slice(0, 8)}
...
</Heading>
          <div style={{ flexGrow: 1 }} />
          <Link
to={`/some-store/${match.params.storeId}`}
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
            {productKeys.map(key => (
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

        <Text
          style={{
            fontSize: '1.3rem',
            fontWeight: 'bold',
            marginBottom: 16,
          }}
        >
          Create a New Product
        
        </Text>
        {/* <ReleaseForm currentStore={currentStore} indexOfAccount={this.props.indexOfAccount} /> */}
        <NewProductForm currentStore={currentStore} indexOfAccount={this.props.indexOfAccount} />
        <br />
        <br />
        <br />
        <br />

        {/* {this.props.stores.map(add => (
          <Link key={add} to={`/admin/store/${add}`}>
            <Box>
              <Heading>Store Id: {add}</Heading>
            </Box>
          </Link>
        ))} */}
      </Box>
    );
  }
}

export default withRouter(
  connect(
    (state, props) => {
      // const contracts = state.store.get('stores').keySeq().toArray();
      const products = state.store.getIn(['stores', props.match.params.storeId]);
      const accounts = state.store.getIn(['web3', 'accounts']);
      return {
        products: products || fromJS({}),
        accounts: state.store.getIn(['web3', 'accounts']),
        currentAccount: state.store.get('currentAccount'),
        // stores: contracts.length ? contracts : [],
        currentStore: props.match.params.storeId,
        accounts,
        indexOfAccount: accounts.indexOf(state.store.get('currentAccount')),
      };
    },
    {
      createProduct,
      getProductsForContract,
    },
  )(StorePage),
);
