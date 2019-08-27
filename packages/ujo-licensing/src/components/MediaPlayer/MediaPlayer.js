import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Box, Flex } from 'rimble-ui';

import ProgressBar from './ProgressBar';
import {
  // MakeSquare,
  SoundLow,
  SoundOn,
  SoundOff,
  PlayBig,
  PauseBig,
  Next,
  Previous,
} from '../Icons';

import './media-player.css';

function getFormattedTime(seconds) {
  const formattedMins = Math.floor(seconds / 60);
  const formattedSecs = Math.floor(seconds % 60);
  const zeroPadding = (formattedSecs < 10) ? '0' : '';
  const formattedTime = `${formattedMins}:${zeroPadding}${formattedSecs}`;
  return formattedTime;
}

export class MediaPlayer extends React.Component {
  // static propTypes = {
  //   playing: PropTypes.bool.isRequired,
  //   playPauseClick: PropTypes.func.isRequired,
  //   nextTrackClick: PropTypes.func.isRequired,
  //   prevTrackClick: PropTypes.func.isRequired,
  //   progressBarChange: PropTypes.func.isRequired,
  //   volumeProgressBarChange: PropTypes.func.isRequired,
  //   pos: PropTypes.number.isRequired,
  //   volume: PropTypes.number.isRequired,
  //   track: PropTypes.instanceOf(Immutable.Map).isRequired,
  //   musicGroupName: PropTypes.string.isRequired,
  //   releaseName: PropTypes.string.isRequired,
  //   releaseImageUrl: PropTypes.string.isRequired,
  //   openPlaylistModal: PropTypes.func.isRequired,
  // };

  constructor(props) {
    super(props);
    this.toggleVolume = this.toggleVolume.bind(this);
  }

  onPlayPauseClick() {
    this.props.playPauseClick();
  }

  toggleVolume() {
    if (this.props.volume > 0.5) {
      this.props.volumeProgressBarChange(0.5);
    } else if (this.props.volume > 0) {
      this.props.volumeProgressBarChange(0);
    } else if (this.props.volume === 0) {
      this.props.volumeProgressBarChange(1);
    }
  }

  render() {
    // Determine the volume icon
    let VolumeIcon;
    if (this.props.volume > 0.5) {
      VolumeIcon = <SoundOn clickable onClick={() => this.toggleVolume()} inactiveColor="#DADADA" activeColor="#F23584" />;
    } else if (this.props.volume > 0) {
      VolumeIcon = <SoundLow clickable onClick={() => this.toggleVolume()} inactiveColor="#DADADA" activeColor="#F23584" />;
    } else if (this.props.volume === 0) {
      VolumeIcon = <SoundOff clickable onClick={() => this.toggleVolume()} inactiveColor="#DADADA" activeColor="#F23584" />;
    }

    // Create human readable representation of track position in seconds
    // eg. 185 seconds => 3:05
    const formattedPos = getFormattedTime(this.props.pos);
    return (
      <div className="media-player-container" style={{
        position: 'fixed',
        zIndex: 999,
        bottom: 0,
        backgroundColor: 'white',
        width: '100%',
      }}>
        <Flex justifyContent="space-between" alignItems="center">
          <Link to="/release/499">
            <Box style={{height: '60px', width: '60px', backgroundImage: `url("https://ujo-licensing-media.s3.amazonaws.com/${this.props.release.get('image')}")`, backgroundSize: 'cover', display: 'inline-block'}}/>
          </Link>
          <Box>
            <span>{this.props.release.get('artistName')}</span>
            <span> - {this.props.release.get('releaseName')}</span>
          </Box>
          <Box>
            <span title={this.props.track.get('name')}>
              {this.props.track.get('name')}
            </span>
          </Box>
          <Box width={200}>
            <span className="current-pos-text">{formattedPos}</span>
            <span style={{ width: '100px', display: 'inline-block', margin: '10px' }}>
              <ProgressBar
                total={this.props.duration}
                oneStepLength={1}
                pos={this.props.pos}
                onClick={(v) => this.props.progressBarChange(v)}
                />
            </span>
            <span className="track-duration-text">{getFormattedTime(this.props.duration)}</span>
          </Box>
          <Box>
            <Previous
              inactiveColor="#DADADA"
              activeColor="#F23584"
              role="button"
              tabIndex="0"
              onClick={() => this.props.prevTrackClick()}
            />
            <span
              style={{ margin: '0 10px', background: '#F23584', borderRadius: '50%', padding: '11px 10px 7px' }}
              onClick={() => this.onPlayPauseClick()}>
              {this.props.playing
                ? <PauseBig activeColor="#DADADA" inactiveColor="white" />
                : <PlayBig activeColor="#DADADA" inactiveColor="#white" />
              }
            </span>
            <Next
              inactiveColor="#DADADA"
              activeColor="#F23584"
              role="button"
              tabIndex="0"
              onClick={() => this.props.nextTrackClick()}
            />
          </Box>
          <Box mr={20}>
            {VolumeIcon}
          </Box>
        </Flex>
      </div>
    );
  }
}

export default MediaPlayer;
