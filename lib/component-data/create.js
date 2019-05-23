import _ from 'lodash';
import cuid from 'cuid';
import { isDefaultComponent } from 'clayutils';
import { create as createElement } from '@nymag/dom';
import store from '../core-data/store';
import { UPDATE_COMPONENT, ADD_DEFAULT_DATA, ADD_SCHEMA } from './mutationTypes';
import { getDefaultData, getSchema, getModel, getData } from '../core-data/components';
import { save as modelSave, render as modelRender } from './model';
import { isComponent } from 'clayutils';
import { refProp, componentRoute, schemaRoute, instancesRoute, getComponentName } from '../utils/references';
import { getObject, getSchema as getSchemaFromAPI } from '../core-data/api';
import { convertSchema, hasAnyBehaviors } from '../core-data/behaviors2input';
import { props } from '../utils/promises';
import { uriToUrl } from '../utils/urls';

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
 * fetch styleguide styles, falling back to _default styles
 * @param  {string} prefix
 * @param  {string} name       or variation
 * @param  {string} styleguide
 */
function fetchStyleguideFallback(prefix, name, styleguide) {
  const styleguidePath = `${prefix}/css/${name}.${styleguide}.css`,
    defaultPath = `${prefix}/css/${name}._default.css`,
    head = document.getElementsByTagName('head')[0],
    styleguideLink = createElement(`<link rel="stylesheet" type="text/css" href="${styleguidePath}" />`);

  styleguideLink.onerror = () => {
    // only load the _default styleguide if the site's styleguide doesn't have styles for this component
    const defaultLink = createElement(`<link rel="stylesheet" type="text/css" href="${defaultPath}" />`);

    head.appendChild(defaultLink);
  };

  // attempt to load styleguide's styles
  head.appendChild(styleguideLink);
}

/**
 * fetch styleguide styles for a component (and variations),
 * falling back to using the '_default' styleguide
 * todo: currently this loads ALL variations, but we want to be more selective in the future
 * @param  {string} prefix     of site
 * @param  {string} name       of component
 * @param  {string} styleguide used by site
 * @param  {array} variations of component styles (both from site styleguide and from _default)
 */
function fetchStyleguideStyles(prefix, name, styleguide, variations) {
  fetchStyleguideFallback(prefix, name, styleguide);

  _.each(variations, (variation) => fetchStyleguideFallback(prefix, variation, styleguide));
}

/**
 * fetch legacy (non-styleguide) styles for a component
 * @param  {string} prefix of site
 * @param  {string} name   of component
 * @param  {string} slug   of site
 */
function fetchLegacyStyles(prefix, name, slug) {
  const baseStylePath = `${prefix}/css/${name}.css`,
    siteStylePath = `${prefix}/css/${name}.${slug}.css`,
    head = document.getElementsByTagName('head')[0],
    baseLink = createElement(`<link rel="stylesheet" type="text/css" href="${baseStylePath}" />`),
    siteLink = createElement(`<link rel="stylesheet" type="text/css" href="${siteStylePath}" />`);

  head.appendChild(baseLink);
  head.appendChild(siteLink);
}

/**
 * fetch styles for new components
 * @param  {string} name of component
 */
function fetchComponentStyles(name) {
  const assetHost = _.get(store, 'state.site.assetHost'),
    prefix = _.get(store, 'state.site.prefix', ''), // default to emptystring for testing
    styleguide = _.get(store, 'state.site.styleguide'),
    variations = _.get(store, `state.componentVariations['${name}']`, []),
    slug = _.get(store, 'state.site.slug');

  if (styleguide) {
    // site has a styleguide! attempt to load component + variation styles,
    // falling back to using the '_default' styleguide
    fetchStyleguideStyles(assetHost || uriToUrl(prefix), name, styleguide, variations);
  } else {
    // legacy: site has no styleguide, so load <component>.css and <component>.<site>.css
    fetchLegacyStyles(assetHost || uriToUrl(prefix), name, slug);
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
    // note: also fetch styles for new components,
    // because if we don't have a schema, we can assume we don't have the styles inlined
    // (we don't care about returning the styles here, but we want to fetch them in parallel)
    return props({
      styles: fetchComponentStyles(name),
      res: getSchemaFromAPI(schemaURI)
    }).then(({ res }) => {
      let newSchema = hasAnyBehaviors(res) ? convertSchema(res, name) : res;

      if (store.state.componentKilnjs) {
        const kilnFile = store.state.componentKilnjs[name];

        if (kilnFile) {
          newSchema = kilnFile({..._.cloneDeep(newSchema), name });
        }
      }

      store.commit(ADD_SCHEMA, { name, data: newSchema });
      return newSchema;
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
    return modelSave(uri, data, {})
      .then((savedData) => modelRender(uri, savedData))
      .then((renderableData) => {
        if (!renderableData.componentVariation && isComponent(uri)) {
          renderableData.componentVariation = getComponentName(uri);
        }

        store.commit(UPDATE_COMPONENT, {uri, data: renderableData});

        return renderableData;
      });
  } else {
    store.commit(UPDATE_COMPONENT, {uri, data});
    return Promise.resolve();
  }
}

/**
 * synchronously determine if a component has references to components
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
        if (item[refProp]) {
          // if they do, and if the component references are base (not instance) refs,
          // add them to the mapping object
          // note: we'll use the mapping object to update the parent component
          // after new instances are created
          mapping[`${key}[${index}]`] = item[refProp];
        }
      });
    } else if (_.isObject(val)) {
      if (val[refProp]) {
        mapping[key] = val[refProp];
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

  _.forOwn(children, (childURI, parentPath) => {
    const childName = getComponentName(childURI);

    let dataPromise;

    if (!isDefaultComponent(childURI)) {
      // clone the already-existing data, rather than fetching the default data
      dataPromise = getData(childURI) ? Promise.resolve(_.toPlainObject(getData(childURI))) : getObject(childURI).then((data) => _.toPlainObject(data)).catch(() => resolveDefaultData(childName));
    } else {
      dataPromise = resolveDefaultData(childName);
    }

    promises[parentPath] = dataPromise.then((defaultData) => {
      const childInstanceURI = `${prefix}${componentRoute}${childName}${instancesRoute}/${cuid()}`,
        grandChildren = getChildComponents(defaultData);

      if (_.size(grandChildren)) {
        return addChildrenToParent(grandChildren, childInstanceURI, defaultData).then((refData) => {
          return resolveSchema(childName)
            .then(() => updateStore(childInstanceURI, refData))
            .then(() => _.assign({}, refData, { [refProp]: childInstanceURI }));
        });
      } else {
        // kick this off so we'll have it after saving
        return resolveSchema(childName).then(() => {
          // add component to the store before adding ref prop
          return updateStore(childInstanceURI, defaultData).then(() => _.assign({}, defaultData, { [refProp]: childInstanceURI }));
        });
      }
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
 * @param  {string} component.name
 * @param  {object} [component.data] optional default data
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
      return updateStore(newInstanceURI, newInstanceData).then((savedData) => _.assign({}, newInstanceData, { [refProp]: newInstanceURI }, savedData));
    }
  });
}

/**
 * create components:
 * - generate instance IDs
 * - resolve and cache default data
 * - resolve and cache schemas
 * - create child components if a ref exists in the default (or passed in) parent data
 * @param  {array} components with { name, [data] }
 * @returns {Promise} with array of created child components
 */
export default function create(components) {
  return Promise.all(_.map(components, (component) => createComponentAndChildren(component)));
}
