/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Flex, Heading, Text, Button } from 'rimble-ui';
import { fromJS } from 'immutable';
import ReactAudioPlayer from 'react-audio-player';
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

import { getTokensForAddressFromContract, getProductsForContract, buyProduct } from '../store/storeActions';

const photos = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];

const name = [
  'A Cooker Ahead',
  'Terkstiben',
  'Basement Adjacent',
  'Way Back When',
  'Placement',
  'Menace',
  'Acovado Tales',
  'Hit The Banister',
];

export class ExternalStorePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playable: {},
    };
  }

  componentWillMount() {
    this.props.getProductsForContract(this.props.match.params.storeId, this.props.indexOfAccount);
  }

  componentDidMount() {
    if (this.props.currentAccount) {
      this.props.getTokensForAddressFromContract(this.props.currentAccount, this.props.match.params.storeId);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentAccount !== this.props.currentAccount) {
      this.props.getTokensForAddressFromContract(this.props.currentAccount, this.props.match.params.storeId);
    }
  }

  onCanPlay(productID) {
    this.setState({
      playable: {
        ...this.state.playable,
        [productID]: true,
      },
    });
  }

  onAbort(productID) {
    this.setState({
      playable: {
        ...this.state.playable,
        [productID]: undefined,
      },
    });
  }

  render() {
    const { products, currentStore, jwt } = this.props;
    const { storeId } = this.props.match.params;

    const productKeys = products.keySeq().toArray();
    return (
      <div>
        <Box p={30}>
          <div style={{display: 'flex'}}>
            <Heading>Store {storeId.slice(0, 8)}...</Heading>
            <div style={{flexGrow: 1}}></div>
            <Link to={`/admin/store/${storeId}`} style={{
                display: 'block',
                textDecoration: 'none',
                float: 'right',
                marginBottom: 20,
            }}>
                <Button>Configure store</Button>
            </Link>
          </div>
          <br />
          <br />
          <Flex p={10} flexWrap="wrap" justifyContent="space-around">
            {productKeys.map((key, i) => {
              const numOwned = this.props.purchases.toJS().filter(x => x === key).length;
              return (
                <Box key={key} height="400px" width="300px" mb="50px">
                  <Box
                    height="300px"
                    width="300px"
                    style={{
                      backgroundImage: `url("${photos[i]}")`,
                      backgroundSize: 'cover',
                    }}
                  />
                  <Text>{name[i]}</Text>
                  {/* {this.props.verified == true ? ( */}


                  {numOwned > 0 && (
                    <div>
                      <ReactAudioPlayer
                        src={`http://localhost:3001/content/${storeId}/${key}/0?jwt=${jwt}` /* @@TODO: track '0' is hard-coded here, make it selectable */}
                        controls
                        onError={err => console.error('AUDIO ERR ~>', err)}
                        onCanPlay={() => this.onCanPlay(key)}
                        onAbort={() => this.onAbort(key)}
                        style={{
                          display: this.state.playable[key] ? 'block' : 'none',
                        }}
                      />
                      <div>You own {numOwned} license(s). </div>
                    </div>
                  )}
                  {numOwned === 0 && <div>You don't own a license yet.</div>}
                  <Button
                    onClick={() =>
                      this.props.buyProduct(key, this.props.match.params.storeId, this.props.currentAccount, this.props.indexOfAccount)
                    }
                  >
                    Buy {numOwned > 0 && 'another'}
                  </Button>
                  {/* ) : (
                      <div>
                        <Button
                          onClick={() =>
                            this.props.buyProduct(key, this.props.match.params.storeId, this.props.currentAccount)
                          }
                        >
                          Buy
                        </Button>
                        <br />
                        <br />
                        <Button
                          onClick={() =>
                            this.props.verifyOwnership(this.props.match.params.storeId, '', key, this.props.currentAccount)
                          }
                        >
                          Verify
                        </Button>
                      </div>
                    ) */}
                </Box>
              );
            })}
          </Flex>
        </Box>
      </div>
    );
  }
}

export default connect(
  (state, props) => {
    const products = state.store.getIn(['stores', props.match.params.storeId]);
    const purchases = state.store.getIn(['purchases', props.match.params.storeId]);
    const accounts = state.store.getIn(['web3', 'accounts']);
    return {
      products: products || fromJS({}),
      currentAccount: state.store.get('currentAccount'),
      jwt: state.store.get('jwt'),
      purchases: purchases || fromJS([]),
      accounts,
      indexOfAccount: accounts.indexOf(state.store.get('currentAccount')),
    };
  },
  {
    getProductsForContract,
    getTokensForAddressFromContract,
    buyProduct,
  },
)(ExternalStorePage);
