import _ from 'lodash';
import { UPDATE_HASH, CLEAR_HASH } from './mutationTypes';
import { getComponentName, getComponentInstance } from '../utils/references';
import { setHash, clearHash } from './hash';

export default {
  [UPDATE_HASH]: (state, { uri, path }) => {
    var component = getComponentName(uri),
      instance = getComponentInstance(uri),
      urlObj = { component, instance, path };

    // Set the state
    _.set(state, 'url', urlObj);
    // Set the hash on the window
    setHash(urlObj);

    return state;
  },
  [CLEAR_HASH]: (state) => {
    // Clear out the `url` obj on state
    _.set(state, 'url', null);
    // Clear the hash on the window
    clearHash();

    return state;
  }
};
