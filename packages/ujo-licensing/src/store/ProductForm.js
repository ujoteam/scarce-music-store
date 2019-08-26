/* eslint-disable react/prop-types */
import React from 'react';
import { connect } from 'react-redux';
import { Button, Form } from 'rimble-ui';

import { createProduct } from './storeActions';

export class ProductForm extends React.Component {
  constructor(props) {
    super(props);
    // create a ref to store the textInput DOM element
    this.id = React.createRef();
    this.price = React.createRef();
    this.inventory = React.createRef();
  }

  handleSubmit(e) {
    e.preventDefault();
    const id = this.id.current.value;
    const price = this.price.current.value;
    const inventory = this.inventory.current.value;
    console.log(`id: ${id}, ${inventory}`);

    const { currentAccount, currentStore, indexOfAccount, licensingContractAddress } = this.props;

    this.props.createProduct(
      id,
      price,
      inventory,
      currentAccount,
      currentStore,
      licensingContractAddress,
      indexOfAccount,
    );
  }

  render() {
    return (
      <Form onSubmit={e => this.handleSubmit(e)}>
        <Form.Field label="Product ID" width={1}>
          <Form.Input
            type="text"
            required
            ref={this.id}
            placeholder="ex. 123"
            width={1}
            onChange={this.handleValidation}
          />
        </Form.Field>
        <Form.Field label="Price" width={1}>
          <Form.Input
            type="text"
            required
            ref={this.price}
            placeholder="in ETH ex. 1"
            width={1}
            onChange={this.handleValidation}
          />
        </Form.Field>
        <Form.Field label="Inventory" width={1}>
          <Form.Input
            type="number"
            required
            ref={this.inventory}
            placeholder="0 represents an infinite amount"
            width={1}
            onChange={this.handleValidation}
          />
        </Form.Field>
        <Button type="submit" width={1}>
          Create
        </Button>
      </Form>
    );
  }
}

export default connect(
  state => ({
    currentAccount: state.store.get('currentAccount'),
    indexOfAccount: state.store.getIn(['web3', 'accounts']).indexOf(state.store.get('currentAccount')),
  }),
  {
    createProduct,
  },
)(ProductForm);
