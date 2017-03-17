// note: creation is purely client-side, now that we're generating unique IDs on both the client and server
import _ from 'lodash';
import cuid from 'cuid';
import store from '../core-data/store';
import { UPDATE_COMPONENT, ADD_DEFAULT_DATA, ADD_SCHEMA } from './mutationTypes';
import { getDefaultData, getSchema, getModel } from '../core-data/components';
import { save as modelSave, render as modelRender } from './model';
import { isDefaultComponent, getComponentName, refProp, componentRoute, schemaRoute, instancesRoute } from '../utils/references';
import { getObject, getSchema as getSchemaFromAPI } from '../core-data/api';
import { props } from '../utils/promises';

/**
 * get default data for a component, from the store or an api call
 * @param  {string} name
 * @param  {object} store
 * @return {Promise}
 */
function resolveDefaultData(name) {
  const prefix = _.get(store, 'state.site.prefix'),
    defaultURI = `${prefix}${componentRoute}${name}`,
    data = getDefaultData(name);

  if (data) {
    return Promise.resolve(data);
  } else {
    // get default data from the server
    return getObject(defaultURI).then((res) => {
      store.commit(ADD_DEFAULT_DATA, { name, data: res });
      return res;
    });
  }
}

/**
 * get schema for a component, from the store or an api call
 * @param  {string} name
 * @param {object} store
 * @return {Promise}
 */
function resolveSchema(name) {
  const prefix = _.get(store, 'state.site.prefix'),
    schemaURI = `${prefix}${componentRoute}${name}${schemaRoute}`,
    schema = getSchema(name);

  if (schema) {
    return Promise.resolve(schema);
  } else {
    // get schema from the server
    return getSchemaFromAPI(schemaURI).then((res) => {
      store.commit(ADD_SCHEMA, { name, data: res });
      return res;
    });
  }
}

/**
 * update the store with created component data
 * note: this does NOT sent a PUT to the server, as that's already handled by
 * the parent component's cascading PUT.
 * the cascading PUT also handles legacy server.js logic,
 * while model logic is handled right here
 * @param  {string} uri
 * @param  {object} data
 * @returns {Promise}
 */
function updateStore(uri, data) {
  if (getModel(uri)) {
    return modelSave(uri, data)
      .then((savedData) => modelRender(uri, savedData))
      .then((renderableData) => store.commit(UPDATE_COMPONENT, {uri, data: renderableData}));
  } else {
    store.commit(UPDATE_COMPONENT, {uri, data});
    return Promise.resolve();
  }
}

/**
 * synchronously determine if a component has references to default components
 * inside component lists. these child components will be cloned
 * when creating the parent component
 * @param {object} data
 * @returns {object}
 */
function getChildComponents(data) {
  let mapping = {};

  _.forOwn(data, function checkProperties(val, key) {
    // loop through the (base) data in the component
    if (_.isArray(val)) {
      // find arrays
      _.each(val, function checkArrays(item, index) {
        // see if these arrays contain components
        if (item[refProp] && isDefaultComponent(item[refProp])) {
          // if they do, and if the component references are base (not instance) refs,
          // add them to the mapping object
          // note: we'll use the mapping object to update the parent component
          // after new instances are created
          mapping[`${key}[${index}]`] = getComponentName(item[refProp]);
        }
      });
    } else if (_.isObject(val)) {
      if (val[refProp] && isDefaultComponent(val[refProp])) {
        mapping[key] = getComponentName(val[refProp]);
      }
    }
  });

  return mapping;
}

/**
 * create child components and add them to the parent data
 * @param {object} children mapping from getChildComponents
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
function addChildrenToParent(children, uri, data) {
  const prefix = _.get(store, 'state.site.prefix');

  let promises = {};

  _.forOwn(children, (val, key) => {
    promises[key] = resolveDefaultData(val).then((defaultData) => {
      const childInstanceURI = `${prefix}${componentRoute}${val}${instancesRoute}/${cuid()}`;

      // kick this off so we'll have it after saving
      return resolveSchema(val).then(() => {
        // add component to the store before adding ref prop
        return updateStore(childInstanceURI, defaultData).then(() => _.assign({}, defaultData, { [refProp]: childInstanceURI }));
      });
    });
  });

  // once we have grabbed all the default data and generated uris, add them to the parent component
  return props(promises).then((childrenData) => {
    const storeData = _.cloneDeep(data),
      fullData = _.cloneDeep(data);

    // first, update the store with just the child refs
    _.forOwn(childrenData, (val, key) => {
      _.set(storeData, key, { [refProp]: val[refProp] });
    });

    return updateStore(uri, storeData).then(() => {
      // then actually add the child data into the parent, so we can do a cascading put
      _.forOwn(childrenData, (val, key) => {
        _.set(fullData, key, val);
      });

      return _.assign({}, fullData, { [refProp]: uri });
    });
  });
}

/**
 * create a component and its children
 * @param  {string} name
 * @param  {object} [data] optional default data
 * @return {Promise}
 */
function createComponentAndChildren({name, data}) {
  const prefix = _.get(store, 'state.site.prefix');

  data = data || {};

  return props({
    schema: resolveSchema(name), // kick this off so we'll have it after saving
    defaultData: resolveDefaultData(name)
  }).then(({defaultData}) => {
    // if we passed in data, merge it with the default data to create the instance
    const newInstanceData = _.assign({}, defaultData, data),
      newInstanceURI = `${prefix}${componentRoute}${name}${instancesRoute}/${cuid()}`,
      children = getChildComponents(newInstanceData);

    if (_.size(children)) {
      // component has child components! create them too
      return addChildrenToParent(children, newInstanceURI, newInstanceData);
    } else {
      // add component to the store before adding ref prop
      return updateStore(newInstanceURI, newInstanceData).then(() => _.assign({}, newInstanceData, { [refProp]: newInstanceURI }));
    }
  });
}

/**
 * create components:
 * - generate instance IDs
 * - resolve and cache default data
 * - resolve and cache schemas
 * - create child components if a default ref exists in the default parent data
 * @param  {array} components with { name, [data] }
 * @returns {Promise} with array of created child components
 */
export default function create(components) {
  return Promise.all(_.map(components, createComponentAndChildren));
}
