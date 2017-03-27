import _ from 'lodash';
import { UPDATE_COMPONENT, REVERT_COMPONENT, ADD_SCHEMA, RENDER_COMPONENT, REMOVE_COMPONENT, ADD_DEFAULT_DATA } from './mutationTypes';

export default {
  // update component with data. this should trigger re-renders,
  // and may be added to the undo manager
  [UPDATE_COMPONENT]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, data);
    return state;
  },
  // revert component with old data (e.g. if server persistence failed).
  // this should trigger re-renders, but should NOT be added to the undo manager
  // (todo: if the component was updated optimistically and reverted, it should actually remove that data from the undo manager)
  [REVERT_COMPONENT]: (state, {uri, oldData}) => {
    _.set(state, `components['${uri}']`, oldData);
    return state;
  },
  [ADD_SCHEMA]: (state, {name, data}) => {
    _.set(state, `schemas['${name}']`, data);
    return state;
  },
  [RENDER_COMPONENT]: (state) => state,
  [REMOVE_COMPONENT]: (state, {uri}) => {
    _.set(state, `components['${uri}']`, {});
    // set to empty obj rather than null so decorators and such don't fail hard
    // (but validators and such don't try to run against removed components)
    return state;
  },
  [ADD_DEFAULT_DATA]: (state, {name, data}) => {
    _.set(state, `componentDefaults[${name}]`, data);
    return state;
  }
};
