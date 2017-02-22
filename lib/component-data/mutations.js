import _ from 'lodash';
import { SAVE_PENDING, SAVE_SUCCESS, SAVE_FAILURE, SERVER_SAVE_PENDING, SERVER_SAVE_SUCCESS } from './mutationTypes';

export default {
  [SAVE_PENDING]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, data);
    _.set(state, `pendingUpdates['${uri}']`, true);
    return state;
  },
  [SAVE_SUCCESS]: (state, uri) => {
    _.set(state, `pendingUpdates['${uri}']`, false);
    return state;
  },
  [SAVE_FAILURE]: (state, {uri, oldData}) => {
    _.set(state, `components['${uri}']`, oldData); // todo: make components reactive so they'll revert to this old data
    _.set(state, `pendingUpdates['${uri}']`, false);
    // todo: set something that shows the error
    return state;
  },
  // server-dependant saves need slightly different mutations
  [SERVER_SAVE_PENDING]: (state, {uri}) => {
    _.set(state, `pendingUpdates['${uri}']`, true);
    return state;
  },
  [SERVER_SAVE_SUCCESS]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, data);
    _.set(state, `pendingUpdates['${uri}']`, false);
    return state;
  }
};
