import _ from 'lodash';
import { isComponent, isLayout, getLayoutName } from 'clayutils';
import { getComponentName } from '../utils/references';
import { toDotNotation } from '../utils/field-path';
import logger from '../utils/log';
import store from './store';

const log = logger(__filename);

// convenience functions to grab component data, schema, etc from the store
// note: all functions allow passing a dummy store object to test

export function getData(uri, path, testStore) {
  const prefix = isLayout(uri) ? 'state.layout.data' : `state.components['${uri}']`;

  testStore = testStore || /* istanbul ignore next */ store;

  if (path) {
    return _.get(testStore, `${prefix}.${path}`); // path might be deep, e.g. `foo.0.bar`
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
  // note: we're lowercasing everything because we don't care about 100% perfect camelCase (e.g. imageURL is valid),
  // we just want to make sure that people aren't using weird characters that cannot be used as properties in dot notation

  // Lodash camelCase strips underscores
  // Allow for n number of underscores at the beginning of a schema field name
  const camel = _.camelCase(str);
  const strippedStr = str.replace(/^_*/, '');

  return strippedStr.toLowerCase() === camel.toLowerCase();
}

/**
 * make sure all properties in a schema are camelCased,
 * since Kiln assumes they will be
 * @param  {string|object} item either an individual path or a full schema
 * @param {string} name
 * @throws {Error} if not camelCased
 */
function assertCamelCasedProps(item, name) {
  if (_.isString(item) && _.includes(toDotNotation(item), '.')) {
    // deep path! make sure all parts of it are camelcased
    const nonCamelCasedPart = _.find(toDotNotation(item).split('.'), part => !isCamelCase(part));

    if (nonCamelCasedPart) {
      log.error(`Properties in component data must be camelCased: ${name} → ${item} (try "${_.camelCase(nonCamelCasedPart)}")`);
    }
  } else if (_.isString(item) && !isCamelCase(item)) {
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
  let schema,
    result,
    name,
    prefix;

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
  if (path && path.match(/\.\d+\./i)) {
    // if the path has a digit, assume it's a complex-list item
    let prevPathIsNumber = false;

    // we need to convert a path like 'content.0.foo' into the schema path,
    // e.g. content.props.1
    // (and we need to be able to do this recursively for deeply-nested complex-lists)
    result = _.get(schema, _.reduce(_.tail(path.split('.')), (schemaPath, part) => {
      const partIsNumber = !_.isNaN(new Number(part)); // convert to a number, see if that works

      if (partIsNumber) {
        // we've hit a number! this means we need to search through the
        // current path's props to find the index of the next part of the path
        schemaPath += '._has.props';
      } else if (prevPathIsNumber) {
        // we had just hit a number before, so this 'part' is a property in a complex-list
        // search through the complex-list's 'props' to find the index we want
        schemaPath += `.${_.findIndex(_.get(schema, schemaPath), prop => prop.prop === part)}`;
      } else {
        schemaPath += `.${part}`;
      }

      prevPathIsNumber = partIsNumber;

      return schemaPath;
    }, _.head(path.split('.'))));
  } else if (path) {
    // _.get() works, no special logic required

    result = _.get(schema, path);
  } else {
    result = schema;
  }

  if (path) {
    assertCamelCasedProps(path, name);
  } else {
    assertCamelCasedProps(schema, name);
  }

  return result;
}

export function getTemplate(uri, testStore) {
  const name = isLayout(uri) ? getLayoutName(uri) : getComponentName(uri);

  testStore = testStore || /* istanbul ignore next */ store;

  return _.get(testStore, `state.templates['${name}']`);
}

export function getModel(uri, testStore) {
  const name = isLayout(uri) ? getLayoutName(uri) : getComponentName(uri);

  testStore = testStore || /* istanbul ignore next */ store;

  return _.get(testStore, `state.models['${name}']`);
}

export function getLocals(testStore) {
  testStore = testStore || /* istanbul ignore next */ store;

  return _.get(testStore, 'state.locals');
}

export function getComponents(testStore) {
  testStore = testStore || /* istanbul ignore next */ store;

  return _.get(testStore, 'state.components');
}
