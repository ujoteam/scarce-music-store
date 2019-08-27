import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Flex, Heading, Text, Button } from 'rimble-ui';
import { fromJS } from 'immutable';
import * as fetch from '../fetch';

import p0 from '../img/pexels0.jpeg';
import p1 from '../img/pexels1.jpeg';
import p2 from '../img/pexels2.jpeg';
import p3 from '../img/pexels3.jpeg';
import p4 from '../img/pexels4.jpeg';
import p5 from '../img/pexels5.jpeg';
import p6 from '../img/pexels6.jpeg';
import p7 from '../img/pexels7.jpeg';
import p8 from '../img/pexels8.jpeg';
import p9 from '../img/pexels9.jpeg';

import { getAllProductsInfo } from '../store/storeActions';

const photos = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];

export const ExternalStorePage = ({ products, accounts, storeName, match, getAllProductsInfo }) => {
  useEffect(() => {
    getAllProductsInfo(match.params.storeId);
  }, [getAllProductsInfo, match.params.storeId, accounts]);

  const productKeys = products.keySeq().toArray();
  // needed because immutable holds pointers both integers and numbers
  const uniqueKeys = [];
  productKeys.map(key => {
    const nKey = parseInt(key)
    if (uniqueKeys.indexOf(nKey) < 0) uniqueKeys.push(nKey);
  })
  return (
    <div>
      <Box p={30}>
        <div style={{display: 'flex'}}>
          <Heading>{storeName}'s Store</Heading>
        </div>
        <br />
        <br />
        <Flex p={10} flexWrap="wrap" justifyContent="space-around">
          {uniqueKeys.map((key, i) => (
            <Link to={`/release/${match.params.storeId}/${key}`} key={key}>
              <Box key={key} height="400px" width="300px" mb="50px" style={{ display: 'inline-block' }}>
                <Box
                  height="300px"
                  width="300px"
                  borderRadius={8}
                  mb={10}
                  style={{
                    backgroundImage: `url("https://ujo-licensing-media.s3.amazonaws.com/${products.getIn([key, 'image'])}")`,
                    backgroundSize: 'cover',
                  }}
                />
                <Text textAlign="center">{products.getIn([key, 'releaseName'])}</Text>
                <Text textAlign="center">{products.getIn([key, 'artistName'])}</Text>
                {/* {this.props.verified == true ? ( */}
              </Box>
            </Link>
          ))}
        </Flex>
      </Box>
    </div>
  );
};

export default connect(
  (state, props) => {
    const storeInfo = state.store.getIn(['stores', props.match.params.storeId]);
    const accounts = state.store.getIn(['web3', 'accounts']);
    return {
      products: storeInfo && storeInfo.get('products') ? storeInfo.get('products') : fromJS({}),
      storeName: storeInfo && storeInfo.get('name') ? storeInfo.get('name') : 'Loading',
      currentAccount: state.store.get('currentAccount'),
      accounts,
    };
  },
  {
    getAllProductsInfo,
  },
)(ExternalStorePage);
