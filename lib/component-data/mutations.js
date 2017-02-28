import _ from 'lodash';
import { COMPONENT_SAVE_PENDING, COMPONENT_SAVE_FAILURE, COMPONENT_SERVER_SAVE_SUCCESS, ADD_DEFAULT_DATA, ADD_SCHEMA, CREATE_COMPONENT } from './mutationTypes';

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
  },
  [ADD_DEFAULT_DATA]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, data);
    return state;
  },
  [ADD_SCHEMA]: (state, {name, data}) => {
    _.set(state, `schemas['${name}']`, data);
    return state;
  },
  [CREATE_COMPONENT]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, data);
    return state;
  }
};
