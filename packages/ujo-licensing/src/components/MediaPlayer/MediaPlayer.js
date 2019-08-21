import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { connect } from 'react-redux';

import ProgressBar from './ProgressBar';
import {
  // IPFSImage,
  // MakeSquare,
  SoundLow,
  SoundOn,
  SoundOff,
  Play,
  Pause,
  Next,
  Previous,
  // Button,
} from '../Icons';

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

  componentDidMount() { document.body.classList.add('media-player-open'); }

  componentWillUnmount() { document.body.classList.remove('media-player-open'); }

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
    const { isPlaylist, personWithPlaylistId } = this.props;
    // Determine the volume icon
    let VolumeIcon;
    if (this.props.volume > 0.5) {
      VolumeIcon = <SoundOn clickable onClick={this.toggleVolume} inactiveColor="#DADADA" activeColor="#F23584" />;
    } else if (this.props.volume > 0) {
      VolumeIcon = <SoundLow clickable onClick={this.toggleVolume} inactiveColor="#DADADA" activeColor="#F23584" />;
    } else if (this.props.volume === 0) {
      VolumeIcon = <SoundOff clickable onClick={this.toggleVolume} inactiveColor="#DADADA" activeColor="#F23584" />;
    }

    // Create human readable representation of track position in seconds
    // eg. 185 seconds => 3:05
    const formattedPos = getFormattedTime(this.props.pos);

    const longTitleClass = classNames('song-title', {
      'long-title': this.props.track.get('name').length > 26,
    });

    return (
      <div className="media-player-container">
        <Link to="/release/499">
          <span>IMAGE ART</span>
        </Link>
        <div className="track-info-container">
          <div className="track-title">
            <span
              title={this.props.track.get('name')}
              className={longTitleClass}
            >{this.props.track.get('name')}
            </span>
          </div>
          <div className="track-artist">
            <span>{this.props.release.get('artistName')}</span>
            <span> - {this.props.release.get('releaseName')}</span>
          </div>
        </div>
        {/* <div className="progress-bar-container" role="progressbar">
          <div className="current-pos-text">{formattedPos}</div>
          <ProgressBar
            total={this.props.track.get('durationInSeconds')}
            oneStepLength={1}
            pos={this.props.pos}
            onClick={(v) => this.props.progressBarChange(v)}
          />
          <div className="track-duration-text">{this.props.track.get('duration')}</div>
        </div> */}
        <div className="media-controls">
          <div
            className="next-prev hidden-xs-down"
            role="button"
            tabIndex="0"
            onClick={() => this.props.prevTrackClick()}
          >
            <Previous
              inactiveColor="#DADADA"
              activeColor="#F23584"
            />
          </div>
          <span
            className="play-status-container"
            style={{ background: 'black' }}
            onClick={() => this.onPlayPauseClick()}>
            {this.props.playing
              ? <Pause activeColor="white" inactiveColor="white" />
              : <Play activeColor="white" inactiveColor="white" />
            }

          </span>
          <div
            className="next-prev hidden-xs-down"
            role="button"
            tabIndex="0"
            onClick={() => this.props.nextTrackClick()}
          >
            <Next
              inactiveColor="#DADADA"
              activeColor="#F23584" />
          </div>
        </div>
        <div className="volume">
          <div className="volume-icon">{VolumeIcon}</div>
          <ProgressBar
            className="volume-slider hidden-sm-down"
            total={1}
            oneStepLength={10}
            pos={this.props.volume}
            onClick={(v) => this.props.volumeProgressBarChange(v)}
          />
        </div>
      </div>
    );
  }
}

export default MediaPlayer;
