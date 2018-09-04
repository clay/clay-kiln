import _ from 'lodash';
import { isComponent, getComponentName, isLayout, getLayoutName } from 'clayutils';
import logger from '../utils/log';
import store from './store';

const log = logger(__filename);

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

  // note: we're lowercasing everything because we don't care about 100% perfect camelCase (e.g. imageURL is valid),
  // we just want to make sure that people aren't using weird characters that cannot be used as properties in dot notation
  return str.toLowerCase() === camel.toLowerCase() || str.toLowerCase() === `_${camel}`.toLowerCase(); // lodash's camelCase() will remove leading underscores, which we allow in things like _version, _description, and _devDescription
}

/**
 * make sure all properties in a schema are camelCased,
 * since Kiln assumes they will be
 * @param  {string|object} item either an individual path or a full schema
 * @param {string} name
 * @throws {Error} if not camelCased
 */
function assertCamelCasedProps(item, name) {
  if (_.isString(item) && !isCamelCase(item)) {
    log.error(`Properties in component data must be camelCased: ${name} → ${item} (try "${_.camelCase(item)}")`);
  } else if (_.isObject(item)) {
    _.forOwn(item, (val, prop) => {
      if (!isCamelCase(prop)) {
        log.error(`Properties in component data must be camelCased: ${name} → ${prop} (try "${_.camelCase(prop)}")`);
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
  let schema, result, name, prefix;

  if (isComponent(uri)) {
    name = getComponentName(uri);
    prefix = `state.schemas['${name}']`;
  } else if (isLayout(uri)) {
    name = getLayoutName(uri);
    prefix = 'state.layout.schema';
  } else {
    name = uri;
    prefix = `state.schemas['${name}']`;
  }

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
