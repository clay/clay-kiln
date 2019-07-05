import _ from 'lodash';
import { UPDATE_HASH, CLEAR_HASH } from './mutationTypes';

export default {
  [UPDATE_HASH]: (state, urlObj) => {
    // Set the state
    _.set(state, 'url', urlObj);

    return state;
  },
  [CLEAR_HASH]: (state) => {
    // Clear out the `url` obj on state
    _.set(state, 'url', null);

    return state;
  }
};
