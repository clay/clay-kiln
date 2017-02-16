import { get, toPlainObject } from 'lodash';
import { getComponentName } from '../utils/references';
import store from './store';

// convenience functions to grab component data, schema, etc from the store
// note: all functions allow passing a dummy store object to test

export function getData(uri, path, testStore) {
  const prefix = `state.components['${uri}']`;

  testStore = testStore || /* istanbul ignore next */ store;

  if (path) {
    return get(testStore, `${prefix}['${path}']`);
  } else {
    return get(testStore, `${prefix}`);
  }
}

export function getSchema(uri, path, testStore) {
  const prefix = `state.schemas['${getComponentName(uri)}']`;

  testStore = testStore || /* istanbul ignore next */ store;

  if (path) {
    return get(testStore, `${prefix}['${path}']`);
  } else {
    return get(testStore, `${prefix}`);
  }
}

export function getTemplate(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return get(testStore, `state.templates["${getComponentName(uri)}"]`);
}

export function getModel(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return get(testStore, `state.models.${_.camelCase(getComponentName(uri))}`);
}

export function getLocals(testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return get(testStore, 'state.locals');
}
