import _ from 'lodash';
import { isComponent, getComponentName } from '../utils/references';
import store from './store';

// convenience functions to grab component data, schema, etc from the store
// note: all functions allow passing a dummy store object to test

export function getData(uri, path, testStore) {
  const prefix = `state.components['${uri}']`;

  testStore = testStore || /* istanbul ignore next */ store;

  if (path) {
    return _.get(testStore, `${prefix}['${path}']`);
  } else {
    return _.get(testStore, `${prefix}`);
  }
}

export function getDefaultData(uri, testStore) {
  const name = isComponent(uri) ? getComponentName(uri) : uri;

  testStore = testStore || /* istanbul ignore next */ store;

  return _.get(testStore, `state.componentDefaults['${name}']`);
}

export function getSchema(uri, path, testStore) {
  const name = isComponent(uri) ? getComponentName(uri) : uri,
    prefix = `state.schemas['${name}']`;

  testStore = testStore || /* istanbul ignore next */ store;

  if (path) {
    return _.get(testStore, `${prefix}['${path}']`);
  } else {
    return _.get(testStore, `${prefix}`);
  }
}

export function getTemplate(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return _.get(testStore, `state.templates['${getComponentName(uri)}']`);
}

export function getModel(uri, testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return _.get(testStore, `state.models['${getComponentName(uri)}']`);
}

export function getLocals(testStore) {
  testStore = testStore || /* istanbul ignore next */ store;
  return _.get(testStore, 'state.locals');
}
