import { fromJS } from 'immutable';
import initialState from '../store/initialState';

export default {
  store: fromJS(initialState),
};
