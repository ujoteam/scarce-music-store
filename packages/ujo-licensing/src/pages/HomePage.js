/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Button, Heading, Text, Flex } from 'rimble-ui';

import { getUserStoreContracts } from '../store/storeActions';

import products from '../img/icons/037-deliverable.png';
import subscriptions from '../img/icons/081-return on investment.png';
import affiliate from '../img/icons/028-cost per acquisition.png';
import roles from '../img/icons/014-briefing.png';
import erc721 from '../img/icons/007-authentic.png';
import scarcity from '../img/icons/093-views.png';
import milkyWay from '../img/pexels1.jpeg';

export class HomePage extends React.Component {
  render() {
    return (
      <div>
        <Box
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1563571444500-94fc9fc3a1d5")',
            backgroundSize: 'cover',
          }}
          p={30}
          pb={300}
          pt={300}
          height="100vh"
        >
          <Heading>Licensing platform built on the Ethereum Network</Heading>
          <Text>The easiest way to create, license and distribute your products with blockchain technology</Text>
          <br />
          <Link to="/admin">
            <Button mr={50}>Get Started</Button>
          </Link>
          <Link to="/developers">
            <Button>Developers</Button>
          </Link>
          <br />
          <br />
        </Box>
        <Box style={{ position: 'relative' }} p={100}>
          <Box
            style={{
              position: 'absolute',
              left: '0',
              top: '0',
              bottom: '0',
              right: '0',
              backgroundImage: `url(${milkyWay})`,
              backgroundSize: 'cover',
              filter: 'opacity(0.02) brightness(1.2)',
            }}
          />
          <Flex flexWrap="wrap" justifyContent="space-around" style={{ position: 'relative' }}>
            <Box width="400px" p={30} mb={30} textAlign="center" style={{ textAlign: 'center' }}>
              <img src={products} width="80" style={{ marginBottom: '40px' }} />
              <Heading mb={20}>Products</Heading>
              <Text textAlign="center">
                Products have there own inventory levels and total supply, that can be managed through smart-contracts
                owned by your business
              </Text>
            </Box>
            <Box width="400px" p={30} mb={30} textAlign="center" style={{ textAlign: 'center' }}>
              <img src={subscriptions} width="80" style={{ marginBottom: '40px' }} />
              <Heading mb={20}>Subscriptions</Heading>
              <Text textAlign="center">Licenses can optionally expire and be renewed by paying additional funds.</Text>
            </Box>
            <Box width="400px" p={30} mb={30} textAlign="center" style={{ textAlign: 'center' }}>
              <img src={affiliate} width="80" style={{ marginBottom: '40px' }} />
              <Heading mb={20}>Affiliate Program</Heading>
              <Text textAlign="center">Revenues can be split with selected affiliates.</Text>
            </Box>
            <Box width="400px" p={30} mb={30} textAlign="center" style={{ textAlign: 'center' }}>
              <img src={roles} width="80" style={{ marginBottom: '40px' }} />
              <Heading textAlign="center" mb={30}>
                Roles-based Permissions
              </Heading>
              <Text textAlign="center">Management of a store can be authorized based on specified access control policies.</Text>
            </Box>
            <Box width="400px" p={30} mb={30} textAlign="center" style={{ textAlign: 'center' }}>
              <img src={erc721} width="80" style={{ marginBottom: '40px' }} />
              <Heading textAlign="center" mb={30}>
                Full ERC-721 Compatibility
              </Heading>
              <Text textAlign="center">
                Licenses are issued as ERC-721 tokens on the Ethereum blockchain making them portable and transferrable.
              </Text>
            </Box>
            <Box width="400px" p={30} mb={30} textAlign="center" style={{ textAlign: 'center' }}>
              <img src={scarcity} width="80" style={{ marginBottom: '40px' }} />
              <Heading textAlign="center" mb={30}>
                Scarcity
              </Heading>
              <Text textAlign="center">
                Limit the availability of specified products and open up potential revenue opportunities through supply
                and demand dynamics.
              </Text>
            </Box>
          </Flex>
        </Box>
        <Box p={30} height={50} style={{ background: 'black' }}>
          {/* <span>
            Icons made by
{' '}
            <a href="https://www.flaticon.com/authors/flat-icons" title="Flat Icons">
              Flat Icons
            </a>
            from
{' '}
            <a href="https://www.flaticon.com/" title="Flaticon">
              www.flaticon.com
            </a>
{' '}
            is licensed by
            <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">
              CC 3.0 BY
            </a>
          </span> */}
        </Box>
      </div>
    );
  }
}

export default withRouter(
  connect(
    state => ({
      currentAccount: state.store.get('currentAccount'),
    }),
    {
      getUserStoreContracts,
    },
  )(HomePage),
);
