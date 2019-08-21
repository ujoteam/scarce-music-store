import { combineReducers } from 'redux';
import storeReducer from '../store/reducer';
import mediaPlayerReducer from '../components/MediaPlayer/reducer';

const reducer = combineReducers({
  mediaPlayer: mediaPlayerReducer,
  store: storeReducer,
});

export default reducer;
