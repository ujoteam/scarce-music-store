import { fromJS, Map } from 'immutable';
import initialState from './initialState';
/**
 * Calculates the track number with circular structure
 * @return {Number} next track number
 */
const getRelativeTrackNumber = (current, offset, length) => {
  // Relative track numbers are circular in nature, therefore
  // (length-1) + 1 = 0 and 0 - 1 = (length-1)
  if (current + offset < 0) {
    return (length + current + offset) % length;
  }
  return (current + offset) % length;
};

const readableDurationToSeconds = (str) => {
  const timeArr = str.split(':').reverse();
  // converts time as strings to number of seconds
  return timeArr.reduce((acc, val, i) => parseInt(acc, 10) + (parseInt(val, 10) * (60 ** i)));
};

const reducer = (state = fromJS(initialState), action) => {
  switch (action.type) {
    case 'TOGGLE_PLAY':
      return state.set('playing', !state.get('playing'));
    case 'SEEK':
      return state.set('pos', action.pos);
    case 'UPDATE_TRACK':
      return state.setIn(['playlist', action.trackNumber], action.updatedTrack);
    case 'SET_RELEASE':
      return state.set('release', action.release)
                  .set('currentTrackIndex', action.index)
                  .set('contractAddress', action.contractAddress)
                  .set('playing', true)
    case 'SET_VOLUME':
      return state.set('volume', action.volume);
    case 'ADJUST_CURRENT_TRACK': {
      const newTrackIndex = getRelativeTrackNumber(state.get('currentTrackIndex'), action.offset, state.get('playlist').size);
      // Make sure we don't set `loading = true` if we are loading the same soundfile
      const currentTrackAddr = state.getIn(['playlist', state.get('currentTrackIndex')]);
      const nextTrackAddr = state.getIn(['playlist', newTrackIndex]);
      let loading = true;
      if (currentTrackAddr === nextTrackAddr) {
        return state.update('trackCount', val => val + 1);
      }
      return state.merge(Map({ // eslint-disable-line new-cap
        currentTrackIndex: newTrackIndex,
        loading,
      }));
    }
    case 'SET_CURRENT_TRACK':
      return state.set('currentTrackIndex', action.newTrackIndex)
                  .update('playing', () => true);
    // case SET_LOADING:
    //   return state.set('loading', action.loading);
    default:
      return state;
  }
}

export default reducer;
