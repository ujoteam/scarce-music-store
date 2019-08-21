import { fromJS } from 'immutable';
import initialState from '../store/initialState';
import initialStateMP from '../components/MediaPlayer/initialState';

export default {
  store: fromJS(initialState),
  mediaPlayer: fromJS(initialStateMP),
};
