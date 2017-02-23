import _ from 'lodash';
import { COMPONENT_SAVE_PENDING, COMPONENT_SAVE_FAILURE, COMPONENT_SERVER_SAVE_SUCCESS } from './mutationTypes';

export default {
  [COMPONENT_SAVE_PENDING]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, data);
    return state;
  },
  [COMPONENT_SAVE_FAILURE]: (state, {uri, oldData}) => {
    _.set(state, `components['${uri}']`, oldData);
    // todo: set something that shows the error
    return state;
  },
  [COMPONENT_SERVER_SAVE_SUCCESS]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, data);
    return state;
  }
};
