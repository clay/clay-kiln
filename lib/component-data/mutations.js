import _ from 'lodash';
import {
  UPDATE_COMPONENT,
  REVERT_COMPONENT,
  ADD_SCHEMA,
  UPDATE_SCHEMA_PROP,
  RENDER_COMPONENT,
  REMOVE_COMPONENT,
  ADD_DEFAULT_DATA,
  CURRENTLY_SAVING,
  OPEN_ADD_COMPONENT,
  CLOSE_ADD_COMPONENT,
  CURRENTLY_RESTORING,
  COMPONENT_ADDED
} from './mutationTypes';
import normalize from '../utils/normalize-component-data';

export default {
  // update component with data. this should trigger re-renders,
  // and may be added to the undo manager
  [UPDATE_COMPONENT]: (state, {uri, data}) => {
    _.set(state, `components['${uri}']`, normalize(data));
    return state;
  },
  // revert component with old data (e.g. if server persistence failed).
  // this should trigger re-renders, but should NOT be added to the undo manager
  // (todo: if the component was updated optimistically and reverted, it should actually remove that data from the undo manager)
  [REVERT_COMPONENT]: (state, {uri, oldData}) => {
    _.set(state, `components['${uri}']`, normalize(oldData));
    return state;
  },
  [ADD_SCHEMA]: (state, {name, data}) => {
    _.set(state, `schemas['${name}']`, { ...data, schemaName: name });
    return state;
  },
  [UPDATE_SCHEMA_PROP]: (state, { schemaName, inputName, prop, value }) => {
    if (state.schemas[schemaName]) {
      _.set(state.schemas[schemaName][inputName], prop, value);
    }

    return state;
  },
  [RENDER_COMPONENT]: (state) => state, // mutation for snapshots, plugins to listen for
  [REMOVE_COMPONENT]: (state, {uri}) => {
    _.set(state, `components['${uri}']`, {});
    // set to empty obj rather than null so decorators and such don't fail hard
    // (but validators and such don't try to run against removed components)
    return state;
  },
  [ADD_DEFAULT_DATA]: (state, {name, data}) => {
    _.set(state, `componentDefaults[${name}]`, data);
    return state;
  },
  [CURRENTLY_SAVING]: (state, isSaving) => {
    _.set(state, 'ui.currentlySaving', isSaving);
    return state;
  },
  [CURRENTLY_RESTORING]: (state, isRestoring) => {
    _.set(state, 'ui.currentlyRestoring', isRestoring);
    return state;
  },
  [OPEN_ADD_COMPONENT]: (state, config) => {
    _.set(state, 'ui.currentAddComponentModal', config);
    return state;
  },
  [CLOSE_ADD_COMPONENT]: (state) => {
    _.set(state, 'ui.currentAddComponentModal', null);
    return state;
  },
  [COMPONENT_ADDED]: (state, { componentName, uri }) => {
    _.set(state, 'page.state.lastComponentAdded', {componentName, uri});
    return state;
  }
};
