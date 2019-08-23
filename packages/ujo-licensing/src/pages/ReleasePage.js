import React, { useEffect } from 'react';
import { fromJS } from 'immutable';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Flex, Heading, Text, Button } from 'rimble-ui';

import p0 from '../img/pexels0.jpeg';
import { getReleaseInfo, buyProduct } from '../store/storeActions';
import { setRelease } from '../components/MediaPlayer/actions';
import { PlayBig, PauseBig, Play, Pause } from '../components/Icons';
import { togglePlay, setCurrentTrackIndex } from '../components/MediaPlayer/actions';

// const photos = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];

const base = {
  artistName: 'Terkstiben',
  releaseName: 'Way Back When',
  price: '10',
  inventory: '10',
  totalSupply: '100',
  datePublished: '11/23/2018',
  description:
    'Mixtape shaman hashtag church-key synth trust fund +1 single-origin coffee tote bag. Bicycle rights gentrify blue bottle actually whatever, cray small batch. Narwhal ramps wayfarers, shabby chic palo santo whatever brunch. Prism ugh poke blue bottle, 3 wolf moon vegan drinking vinegar mlkshk chia.',
  recordLabel: 'Hit The Banister',

  releaseImageUrl: p0,
  tracks: [
    {
      name: 'Acovado Tales',
      url:
        'https://freemusicarchive.org/file/music/no_curator/spectacular/What_Whas_That/spectacular_-_01_-_What_Was_That_Spectacular_Sound_Productions.mp3',
    },
    {
      name: 'Shambet Tales',
      url:
        'https://freemusicarchive.org/file/music/no_curator/spectacular/What_Whas_That/spectacular_-_01_-_What_Was_That_Spectacular_Sound_Productions.mp3',
    },
    {
      name: 'Acovado Tales',
      url:
        'https://freemusicarchive.org/file/music/no_curator/spectacular/What_Whas_That/spectacular_-_01_-_What_Was_That_Spectacular_Sound_Productions.mp3',
    },
  ],
};

const ReleasePage = ({ buyProduct, currentAccount, licenseSale, web3Initialized, releaseInfo, match, getReleaseInfo, setRelease, togglePlay, setCurrentTrackIndex, currentTrackIndex, playing, sameReleaseAsMP }) => {
  useEffect(() => {
    if (web3Initialized) {
      getReleaseInfo(match.params.releaseId, match.params.storeId);
    }
  }, [match.params.releaseId, match.params.storeId, web3Initialized]);

  const onPlayPauseClick = () => {
    if (sameReleaseAsMP) togglePlay();
    else setRelease(releaseInfo, match.params.storeId);
  };

  const onTrackClick = index => {
    if (sameReleaseAsMP) {
      if (currentTrackIndex === index) togglePlay();
      else setCurrentTrackIndex(index);
    } else {
      setRelease(releaseInfo, match.params.storeId);
    }
  };

  const salesLeft = releaseInfo.get('totalSupply') - releaseInfo.get('totalSold');
  return (
    <Box position="relative" minHeight="100vh" style={{ overflow: 'hidden' }}>
      <Box
        position="absolute"
        top="-60px"
        left="-60px"
        right="-60px"
        bottom="-100px"
        zIndex="-1"
        style={{
          backgroundImage: `url("${p0}")`,
          backgroundSize: 'cover',
          filter: 'blur(20px)',
        }}
      />
      <Box
        p={30}
        borderRadius="10px"
        width={3 / 4}
        m="100px auto"
        style={{
          background: 'rgba(255,255,255, 0.8)',
        }}
      >
        <Box width={1 / 4} display="inline-block" verticalAlign="top">
          <Box
            width="100%"
            borderRadius="8px"
            style={{
              backgroundImage: `url("${p0}")`,
              backgroundSize: 'cover',
              paddingBottom: '100%',
            }}
          />
          <p>{releaseInfo.get('description')}</p>
        </Box>
        <Box width={3 / 4} display="inline-block" pl={30}>
          <Flex justifyContent="space-between" mb={30}>
            <Box width={3 / 4}>
              <h1 style={{ marginTop: '0' }}>
                {releaseInfo.get('artistName')} - {releaseInfo.get('releaseName')}
              </h1>
              <span>Release date: {releaseInfo.get('datePublished')}</span>
              <br />
              <span>Record Label: {releaseInfo.get('recordLabel')}</span>
              <br />
              <Link to={`/store/${match.params.storeId}`}>Back to Store</Link>
            </Box>
            <Box mr={20}>
              <div
                style={{ margin: '0 10px', background: '#F23584', borderRadius: '50%', padding: '16px 20px ' }}
                onClick={() => onPlayPauseClick()}
              >
                {playing && sameReleaseAsMP
                  ? <PauseBig h={40} w={40} activeColor="#DADADA" inactiveColor="white" />
                  : <PlayBig h={40} w={40} activeColor="#DADADA" inactiveColor="white" />
                }
              </div>
            </Box>
          </Flex>
          <Box mb={40}>
            {releaseInfo.get('tracks').map((track, i) => (
              <Flex key={i} justifyContent="space-between" mb={10}>
                <span>
                  {i + 1} {track.get('name')}
                </span>
                <span onClick={() => onTrackClick(i)}>
                  {playing && sameReleaseAsMP && currentTrackIndex === i
                    ? <Pause activeColor="#f23584" inactiveColor="#DADADA" />
                    : <Play activeColor="#f23584" inactiveColor="#DADADA" />
                  }
                </span>
              </Flex>
            ))}
          </Box>
        </Box>
        <Box style={{ textAlign: 'right' }}>
          <span>There are {salesLeft} releases left of the {releaseInfo.get('inventory')} created.</span>
          <br />
          <Button onClick={() => buyProduct(match.params.releaseId, match.params.storeId, currentAccount)}>
            Buy Release - ${releaseInfo.get('price')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default connect(
  (state, ownProps) => ({
    releaseInfo: state.store.getIn(['stores', ownProps.match.params.storeId, 'products', ownProps.match.params.releaseId]) || fromJS(base),
    licenseSale: state.store.getIn(['stores', ownProps.match.params.storeId, 'LicenseSale']),
    playing: state.mediaPlayer.get('playing'),
    sameReleaseAsMP: state.mediaPlayer.getIn(['release', 'id']) === ownProps.match.params.releaseId,
    currentTrackIndex: state.mediaPlayer.get('currentTrackIndex'),
    web3Initialized: !!state.store.getIn(['web3', 'accounts', 0]),
    currentAccount: state.store.get('currentAccount'),
  }),
  {
    getReleaseInfo,
    setRelease,
    togglePlay,
    setCurrentTrackIndex,
    buyProduct,
  },
)(ReleasePage);
