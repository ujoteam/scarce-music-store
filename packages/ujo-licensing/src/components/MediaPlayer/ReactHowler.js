// This file is based on https://github.com/thangngoc89/react-howler
import React from 'react';
import PropTypes from 'prop-types';
import { Howl } from 'howler';

export default class ReactHowler extends React.Component {
  // static propTypes = {
  //   src: PropTypes.oneOfType([
  //     PropTypes.string,
  //     PropTypes.arrayOf(PropTypes.string),
  //   ]).isRequired,
  //   playing: PropTypes.bool.isRequired,
  //   onLoad: PropTypes.func.isRequired,
  //   onEnd: PropTypes.func.isRequired,
  //   format: PropTypes.string.isRequired,
  //   uniqueTrackId: PropTypes.string.isRequired,
  //   mute: PropTypes.bool,
  //   loop: PropTypes.bool,
  //   onPause: PropTypes.func,
  //   onPlay: PropTypes.func,
  //   onLoadError: PropTypes.func,
  // };

  // static defaultProps = {
  //   mute: false,
  //   loop: false,
  //   onPause: () => {},
  //   onPlay: () => {},
  //   onLoadError: () => {},
  // };


  constructor(props) {
    super(props);
    this.initHowler = this.initHowler.bind(this);
  }

  componentDidMount() {
    this.initHowler();
    this.toggleHowler();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src) {
      this.initHowler();
      this.toggleHowler();
    }
    if (prevProps.playing !== this.props.playing) {
      this.toggleHowler();
    }
  }

  componentWillUnmount() {
    this.destroyHowler();
  }

  // set howler(howl) {
  //   if (howl) {
  //     this._howler = howl; // eslint-disable-line no-underscore-dangle
  //   }
  // }

  // get howler() {
  //   return this._howler; // eslint-disable-line no-underscore-dangle
  // }

  // Create howler object with given props
  initHowler() {
    this.destroyHowler();
    if (typeof Howl !== 'undefined') { // Check if window is available
      this.howler = new Howl({
        src: this.props.src,
        mute: this.props.mute,
        loop: this.props.loop,
        onend: this.props.onEnd,
        onplay: this.props.onPlay,
        onpause: this.props.onPause,
        onload: this.props.onLoad,
        onloaderror: this.props.onLoadError,
        html5: true,
      });
    }
    window.h = this.howler;
  }

  // Stop, unload and destroy howler object
  destroyHowler() {
    if (this.howler) {
      this.howler.off(); // Remove event listener
      this.howler.stop(); // Stop playback
      this.howler.unload(); // Remove sound from pool
      this.howler = null; // Destroy it
    }
  }

  toggleHowler() {
    if (this.props.playing) {
      this.play();
    } else {
      this.pause();
    }
    // TODO: handle mute and loop
    // runIfSet(props.mute, this.mute(props.mute));
    // runIfSet(props.loop, this.loop(props.loop));

    if (this.props.seek !== this.seek()) {
      this.seek(this.props.seek);
    }
  }

  // Begins playback of a sound when not playing
  play() {
    const playing = this.howler.playing();

    if (!playing) {
      // const pos = this.howler.seek();
      this.howler.play();
      // if (this.howler.seek() !== pos) {
      //   this.howler.seek(pos);
      // }
    }
  }

  /**
   * Pauses playback of sound or group
   * If no id given, pauses all playback
   * @param {Number} id = undefined [sound of group to pause]
   */
  pause(id = undefined) {
    if (id) {
      this.howler.pause(id);
    } else {
      this.howler.pause();
    }
  }

  /**
   * Mutes the sound, but doesn't pause the playback.
   * @param {Boolean} [muted] [True to mute and false to unmute]
   * @param {Number} [id] [The sound ID. If none is passed, all sounds in group are muted]
   */
  mute(...args) {
    this.howler.mute(...args);
  }

  /**
   * Get/set whether to loop the sound or group. This method can optionally take 0, 1 or 2 arguments.
   * @param {Boolean} [loop] [To loop or not to loop, that is the question]
   * @param {Number} [id] [The sound ID. If none is passed, all sounds in group will have their loop property updated]
   */
  loop(...args) {
    return this.howler.loop(...args);
  }

  /**
   * Set/get current position of player
   * @param  {Number} pos [seek player to position]
   * @return {Number}     [return current position]
   */
  seek(pos = null) {
    if (!this.howler) {
      return 0;
    }

    // if (!pos && pos !== 0) {
    //   return this.howler.seek();
    // }

    if (pos || pos === 0) {
      this.howler.seek(pos);
      return pos;
    }
    return 0;
  }

  /**
   * Get the duration of the audio source
   * @return {Number} [Audio length in seconds. Will return 0 until after the load event fires]
   */
  duration() {
    // currently broken
    return this.howler.duration();
  }

  /**
   * Only render a placeholder
   */
  render() {
    return React.createElement('div', null);
  }
}
