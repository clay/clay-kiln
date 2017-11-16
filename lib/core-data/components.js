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

/**
 * check to see if a string is camelCased
 * @param  {string} str
 * @return {boolean}
 */
function isCamelCase(str) {
  const camel = _.camelCase(str);

  return str === camel || str === `_${camel}`; // lodash's camelCase() will remove leading underscores, which we allow in things like _version, _description, and _devDescription
}

/**
 * make sure all properties in a schema are camelCased,
 * since Kiln assumes they will be
 * @param  {string|object} item either an individual path or a full schema
 * @throws {Error} if not camelCased
 */
function assertCamelCasedProps(item) {
  if (_.isString(item) && !isCamelCase(item)) {
    throw new Error(`Properties in component data must be camelCased: ${name} → ${item}`);
  } else if (_.isObject(item)) {
    _.forOwn(item, (val, prop) => {
      if (!isCamelCase(prop)) {
        throw new Error(`Properties in component data must be camelCased: ${name} → ${prop}`);
      }
    });
  }
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

  let schema, result;

  testStore = testStore || /* istanbul ignore next */ store;
  schema = _.get(testStore, prefix);
  result = path ? _.get(schema, path) : schema;

  if (path) {
    assertCamelCasedProps(path, name);
  } else {
    assertCamelCasedProps(schema, name);
  }

  return result;
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
