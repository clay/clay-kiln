import _ from 'lodash';
import { isComponent, getComponentName } from '../utils/references';
import { hasAnyBehaviors, convertSchema } from './behaviors2input';
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

/**
 * get the schema for a component (or property of a component)
 * note: if the schema uses the old behaviors api, it will print a warning
 * and convert it to the kiln 5.x inputs api syntax
 * @param  {string} uri
 * @param  {string} [path]
 * @param  {object} testStore
 * @return {object}
 */
export function getSchema(uri, path, testStore) {
  const name = isComponent(uri) ? getComponentName(uri) : uri,
    prefix = `state.schemas['${name}']`;

  let schema;

  testStore = testStore || /* istanbul ignore next */ store;
  schema = _.get(testStore, prefix);

  if (hasAnyBehaviors(schema)) {
    // schema is old! convert it before returning it
    if (path) {
      // only convert a subset (for an individual field)
      return _.has(schema, path) && convertSchema(schema, name, path);
    } else {
      // convert the whole schema
      return convertSchema(schema, name);
    }
  } else {
    // schema is new! return it
    return path ? _.get(schema, path) : schema;
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
