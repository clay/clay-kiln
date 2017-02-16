import _ from 'lodash';
import { SAVE_PENDING, SAVE_SUCCESS, SAVE_FAILURE } from './mutationTypes';

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
    _.set(state, `components['${uri}']`, oldData);
    _.set(state, `pendingUpdates['${uri}']`, false);
    return state;
  }
};
