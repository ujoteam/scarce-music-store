import React, { Fragment } from 'react';
import Immutable, { Map } from 'immutable';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import MediaPlayer from './MediaPlayer';
import ReactHowler from './ReactHowler';
// import { AUDIO_PROXY_ENDPOINT } from '../../constants/endpoints';
import { togglePlay, seek, setVolume, nextTrack, prevTrack, setPlaying } from './actions';

export class MediaPlayerContainer extends React.Component {
  // static propTypes = {
  //   playing: PropTypes.bool.isRequired,
  //   loading: PropTypes.bool.isRequired,
  //   volume: PropTypes.number.isRequired,
  //   trackCount: PropTypes.number.isRequired,
  //   currentTrack: PropTypes.instanceOf(Immutable.Map),
  //   togglePlay: PropTypes.func.isRequired,
  //   setLoading: PropTypes.func.isRequired,
  //   seek: PropTypes.func.isRequired,
  //   setVolume: PropTypes.func.isRequired,
  //   nextTrack: PropTypes.func.isRequired,
  //   prevTrack: PropTypes.func.isRequired,
  //   currentTrackIndex: PropTypes.number.isRequired,
  // };

  // static defaultProps = {
  //   currentTrack: null,
  // };

  constructor(props) {
    super(props);
    this.state = {
      pos: 0,
    };
    this.player = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.playing && this.props.playing) {
      setTimeout(() => this.updatePos(), 100);
    }
    // html5 hack for releases with one song
    // when user hits next or previous song
    if (prevProps.trackCount !== this.props.trackCount) {
      this.player.current.howler.seek(0);
    }
  }

  onLoadHandler() {
    this.player.current.howler.volume(this.props.volume);
    // this.props.setLoading(false);
  };

  nextTrackHandler() {
    this.props.nextTrack();
  };

  prevTrackHandler() {
    this.props.prevTrack();
  };

  progressBarChangeHandler(progressPercentage) {
    const duration = this.props.duration;
    console.log('progressPercentage', progressPercentage)
    this.setState(
      {
        pos: progressPercentage * duration,
      },
      () => {
        this.player.current.howler.seek(this.state.pos);
        this.props.seek(this.state.pos);
      },
    );
  };

  volumeSliderChangeHandler(newVolume) {
    this.player.current.howler.volume(newVolume);
    this.props.setVolume(newVolume);
  };

  updatePos() {
    if (!this.player.current.howler) return;

    const currentPosition = this.player.current.howler.seek();
    this.setState({ pos: currentPosition });
    if (typeof currentPosition === 'number') {
      // HTML5 does not auto play so check if seek is
      // (almost) at duration and if so, call next track
      // TODO: remove would be great - improve Howler...
      const duration = this.props.duration;
      const isAtEnd = duration - currentPosition < 1;
    if (isAtEnd) this.nextTrackHandler();
    }

    // If we are still playing, we want to continue to update the pos
    if (this.props.playing) {
      setTimeout(() => this.updatePos(), 1000);
    }
  };

  render() {
    if (!this.props.currentTrack) return null;

    const src = `/content/${this.props.contractAddress}/${this.props.release.get('id')}/${this.props.currentTrackIndex}?jwt=${this.props.jwt}`;
    // const src = 'https://freemusicarchive.org/file/music/Oddio_Overplay/Gustav_Landin/Canzoni_per_i_Natali_del_Futuro/Gustav_Landin_-_01_-_Elatan.mp3';
    // const format = this.props.currentTrack.getIn(['audio', 'encodingFormat']).split('/')[1];
    // const uniqueTrackId = `${this.props.currentTrack.get('releaseId')}-${this.props.currentTrackIndex}`;
    return (
      <Fragment>
        <MediaPlayer
          pos={this.state.pos}
          duration={this.props.duration}
          volume={this.props.volume}
          volumeProgressBarChange={v => this.volumeSliderChangeHandler(v)}
          track={this.props.currentTrack}
          release={this.props.release}
          playing={this.props.playing}
          loading={this.props.loading}
          playPauseClick={this.props.togglePlay}
          nextTrackClick={() => this.props.nextTrack()}
          prevTrackClick={() => this.props.prevTrack()}
          progressBarChange={(v) => this.progressBarChangeHandler(v)}
          openPlaylistModal={() => this.setState({ playlistModal: true })}
        />
        <ReactHowler
          src={src}
          playing={this.props.playing}
          onPlay={() => this.props.setPlaying()}
          onPause={() => console.log('PAUSEEE')}
          onLoad={() => this.onLoadHandler}
          onEnd={() => this.nextTrackHandler}
          ref={this.player}
        />
      </Fragment>
    );
  }
}

// TODO: Fix hardcoding of 'audio/mpeg' for format in ReactHowler

function mapStateToProps(state) {
  const trackIndex = state.mediaPlayer.get('currentTrackIndex');
  const currentTrack = state.mediaPlayer.getIn(['release', 'tracks', trackIndex]);
  const owned = state.mediaPlayer.getIn(['release', 'owned']);
  return {
    jwt: state.store.get('jwt'),
    playing: state.mediaPlayer.get('playing'),
    loading: state.mediaPlayer.get('loading'),
    volume: state.mediaPlayer.get('volume'),
    trackCount: state.mediaPlayer.get('trackCount'),
    duration: owned ? currentTrack.get('duration') : 10,
    currentTrack,
    currentTrackIndex: trackIndex,
    release: state.mediaPlayer.get('release'),
    contractAddress: state.mediaPlayer.get('contractAddress'),
  };
}

export default connect(
  mapStateToProps,
  {
    togglePlay,
    setPlaying,
    // setLoading,
    seek,
    setVolume,
    nextTrack,
    prevTrack,
  },
)(MediaPlayerContainer);
