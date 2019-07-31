import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Button, Heading, Text, Flex } from 'rimble-ui';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export default class DeveloperPage extends React.Component {
  componentDidMount() {}

  render() {
    const createProductString = `
    const ujo = require('ujo')('sk_test_0x4eC39HqLyjWDarjtT1zdp7dc');

    // Token is created using Ujo Components!
    // Get the product token ID submitted by the form:
    const token = request.body.ujoToken; // Using Express
    
    (async () => {
      const product = await ujo.products.create({
        productId: 1,
        price: 100,
        supply: '9999',
        token: token,
      });
    })();
    `;

    const createLicenseString = `
    const ujo = require('ujo')('sk_test_0x4eC39HqLyjWDarjtT1zdp7dc');

    // Token is created using Ujo Components!
    // Get the product token ID submitted by the form:
    const token = request.body.ujoToken; // Using Express
    
    (async () => {
      const product = await ujo.license.create({
        productId: 1,
        price: 100,
        purchaserAddress: '0xlkjavmoi098nnl0',
        token: token,
      });
    })();
    `;
    const productHtmlString = `
    <script src="https://js.ujo.com/v3/" />
      <form action="/product" method="post" id="product-form">
        <div className="form-row">
          <label htmlFor="product-element" />
          <div id="product-element">{/* <!-- A Ujo Component will be inserted here. --> */}</div>

          {/* <!-- Used to display form errors. --> */}
          <div id="product-errors" role="alert" />
        </div>
        <button>Create Product</button>
      </form>
    `;

    const productJsString = `
    // Create a Ujo instance.
    const ujo = Ujo('0xTYooMQauvdEDq54NiTphI7jx');

    // Create an instance of Components.
    const components = ujo.components();

    // Custom styling can be passed to options when creating Components.
    const style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };

    // Create an instance of the product Component.
    var product = components.create('product', {style: style});

    // Add an instance of the product Component into the \`product-element\` <div>.
    product.mount('#product-element');
    `;
    return (
      <Box p={30}>
        <Box>
          <Heading mb={30}>The Ujo API</Heading>
          <Text>
            The Ujo API allows for the simple creation of products, the licenses and policies attached to those products
            and the verification of licenses.
          </Text>
          <Text />
          <br />
          <br />
          <Text>Creating a Product</Text>
          <SyntaxHighlighter language="javascript" style={docco}>
            {createProductString}
          </SyntaxHighlighter>

          <br />
          <br />
          <Text>Creating a License</Text>
          <SyntaxHighlighter language="javascript" style={docco}>
            {createLicenseString}
          </SyntaxHighlighter>
        </Box>

        <Box mt={100}>
          <Heading mb={30}>Ujo.js and Components</Heading>
          <Text>
            Ujo.js is an SDK and library for building licensing integrations on Ethereum. The components provided,
            enable you to collect to create licenses attached to the products your business offers on the blockchain
            using customizable UI elements. Ujo.js also provides a single interface for interacting with Ujo APIs.
          </Text>
          <Text />
          <br />
          <br />

          <SyntaxHighlighter language="html" style={docco}>
            {productHtmlString}
          </SyntaxHighlighter>

          <SyntaxHighlighter language="javascript" style={docco}>
            {productJsString}
          </SyntaxHighlighter>
        </Box>
      </Box>
    );
  }
}
