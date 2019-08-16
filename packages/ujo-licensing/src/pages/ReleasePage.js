/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { fromJS } from 'immutable';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Box, Flex, Heading, Text, Button } from 'rimble-ui';
// import ReactAudioPlayer from 'react-audio-player';

import p0 from '../img/pexels0.jpeg';

// const photos = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];

const releaseInfo = {
  artistName: 'Terkstiben',
  releaseName: 'Way Back When',
  price: '10',
  inventory: '10',
  totalSupply: '100',
  datePublished: '11/23/2018',
  description: 'Mixtape shaman hashtag church-key synth trust fund +1 single-origin coffee tote bag. Bicycle rights gentrify blue bottle actually whatever, cray small batch. Narwhal ramps wayfarers, shabby chic palo santo whatever brunch. Prism ugh poke blue bottle, 3 wolf moon vegan drinking vinegar mlkshk chia.',
  recordLabel: 'Hit The Banister',

  releaseImageUrl: p0,
  tracks: [
    {
      name: 'Acovado Tales',
      url: 'https://freemusicarchive.org/file/music/no_curator/spectacular/What_Whas_That/spectacular_-_01_-_What_Was_That_Spectacular_Sound_Productions.mp3',
    },
    {
      name: 'Shambet Tales',
      url: 'https://freemusicarchive.org/file/music/no_curator/spectacular/What_Whas_That/spectacular_-_01_-_What_Was_That_Spectacular_Sound_Productions.mp3',
    },
    {
      name: 'Acovado Tales',
      url: 'https://freemusicarchive.org/file/music/no_curator/spectacular/What_Whas_That/spectacular_-_01_-_What_Was_That_Spectacular_Sound_Productions.mp3',
    }
  ]
}

const ReleasePage = props => {

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
          backgroundImage: `url("${releaseInfo.releaseImageUrl}")`,
          backgroundSize: 'cover',
          filter: 'blur(20px)',
        }}
      />
      <Box
        p={20}
        borderRadius="10px"
        width={3/4}
        m="100px auto"
        style={{
          background: 'rgba(255,255,255, 0.8)',
        }}
      >
        <Box width={1/4} display="inline-block" p={30}>
          <Box
            width={200}
            height={200}
            style={{
              backgroundImage: `url("${releaseInfo.releaseImageUrl}")`,
              backgroundSize: 'cover',
            }}
          />
          <p>{releaseInfo.description}</p>
        </Box>
        <Box width={3/4} display="inline-block" p={30}>
          <Flex justifyContent="space-between" mb={60}>
            <Box width={3/4}>
              <h1>{releaseInfo.artistName} - {releaseInfo.releaseName}</h1>
              <span>Release date: {releaseInfo.datePublished}</span>
              <br/>
              <span>Record Label: {releaseInfo.recordLabel}</span>
            </Box>
            <Button onClick={() => console.log('click')}>Play/Pause</Button>
          </Flex>
          <Box mb={100}>
            {releaseInfo.tracks.map((track, i) => (
              <Flex key={i} justifyContent="space-between" mb={10}>
                <span>{i + 1}   {track.name}</span>
                <button>p</button>
              </Flex>
            ))}
          </Box>
          <Box>
            <span>There are only {releaseInfo.inventory} purchases left.</span>
            <br/>
            <Button onClick={() => console.log('BUYYYY')}>Buy Release - ${releaseInfo.price}</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReleasePage;
