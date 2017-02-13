import { get } from 'lodash';
import { getComponentName } from '../utils/references';
import store from './store';

// convenience functions to grab component data, schema, etc from the store
// note: all functions allow passing a dummy store object to test

export function getData(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return get(testStore, `state.components["${uri}"]`);
}

export function getSchema(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return get(testStore, `state.schemas["${getComponentName(uri)}"]`);
}

export function getTemplate(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return get(testStore, `state.templates["${getComponentName(uri)}"]`);
}

export function getModel(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return get(testStore, `state.models["${getComponentName(uri)}"]`);
}
