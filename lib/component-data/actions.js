import _ from 'lodash';
import { removeElement, find } from '@nymag/dom';
import { COMPONENT_SAVE_PENDING, COMPONENT_SAVE_FAILURE, COMPONENT_SERVER_SAVE_SUCCESS, ADD_DEFAULT_DATA, ADD_SCHEMA, CREATE_COMPONENT } from './mutationTypes';
import { getData, getModel, getTemplate, getSchema } from '../core-data/components';
import { isDefaultComponent, getComponentName, refProp, refAttr, layoutAttr, editAttr, componentListProp, componentProp, componentRoute, schemaRoute, instancesRoute } from '../utils/references';
import { save as modelSave, render as modelRender } from './model';
import { render as renderTemplate } from './template';
import { decorateURIAndChildren } from '../decorators';
import { save, saveForHTML, getObject, getSchema as getSchemaFromAPI, create } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import label from '../utils/label';
import { getComponentEl, getParentComponent, getPrevComponent } from '../utils/component-elements';
import getAvailableComponents from './available-components';
import { props } from '../utils/promises';

/**
 * log errors when components save and display them to the user
 * @param  {string} uri
 * @param  {Error} e
 * @param  {object} store
 */
function logSaveError(uri, e, store) {
  console.error(`Error saving component (${getComponentName(uri)}):`, e);
  store.dispatch('showStatus', { type: 'error', message: `Changes made to ${label(getComponentName(uri))} were not saved!` });
}

/**
 * save data client-side and queue up api call for the server
 * note: this uses the components' model.js and handlebars template
 * @param  {string} uri
 * @param  {object} data
 * @param {object} oldData
 * @param {object} store
 * @return {Promise}
 */
function clientSave(uri, data, oldData, store) {
  return modelSave(uri, data)
    .then((savedData) => {
      // kick api call off in the background
      addToQueue(save, [uri, data])
        // note: we don't care about the data we got back from the api
        .catch((e) => {
          store.commit(COMPONENT_SAVE_FAILURE, {uri, oldData});
          logSaveError(uri, e, store, store);
          return renderTemplate(uri, oldData)
            .then((html) => decorateURIAndChildren(uri, html)); // revert the html (of all matching elements)
        });

      return savedData;
    })
    .then((savedData) => modelRender(uri, savedData))
    .then((renderableData) => {
      store.commit(COMPONENT_SAVE_PENDING, {uri, data: renderableData});
      return renderableData;
    })
    .then((renderableData) => renderTemplate(uri, renderableData))
    .then((html) => decorateURIAndChildren(uri, html)); // replace and decorate the new html (of all matching elements)
      // todo: not sure if we can decorate in vdom or whatnot, or if we can do reactive re-rendering in a more declarative way
}

/**
 * save data server-side, but re-render client-side afterwards
 * note: this uses deprecated server.js, but renders with handlebars template
 * @param  {string} uri
 * @param  {object} data
 * @param {object} oldData
 * @param {object} store
 * @return {Promise}
 */
function serverSave(uri, data, oldData, store) {
  return addToQueue(save, [uri, data])
    .then((res) => {
      store.commit(COMPONENT_SERVER_SAVE_SUCCESS, {uri, data: res});
      return res;
    })
    .then((renderableData) => renderTemplate(uri, renderableData))
    .then((html) => decorateURIAndChildren(uri, html))
    .catch((e) => {
      store.commit(COMPONENT_SAVE_FAILURE, {uri, oldData});
      logSaveError(uri, e, store);
    });
}

/**
 * save data AND re-render server-side
 * note: this uses deprecated server.js and deprecated server-dependent template
 * @param  {string} uri
 * @param  {object} data
 * @param {object} oldData
 * @param {object} store
 * @return {Promise}
 */
function serverSaveAndRerender(uri, data, oldData, store) {
  return addToQueue(saveForHTML, [uri, data])
    .then((html) => { // PUT to html before getting new data
      return addToQueue(getObject, [uri])
        .then((res) => {
          store.commit(COMPONENT_SERVER_SAVE_SUCCESS, {uri, data: res});
          decorateURIAndChildren(uri, html); // decorate AFTER getting new data and populating the store
          return res;
        })
        // otherwise revert the data
        .catch((e) => {
          store.commit(COMPONENT_SAVE_FAILURE, {uri, oldData});
          logSaveError(uri, e, store);
        });
    });
}

/**
 * save a component's data and re-render
 * @param {object} store
 * @param  {string} uri
 * @param  {object} data (may be a subset of the data)
 * @return {Promise}
 */
export function saveComponent(store, {uri, data}) {
  const oldData = getData(uri),
    dataToSave = _.assign({}, oldData, data),
    model = getModel(uri),
    template = getTemplate(uri);

  let promise;

  if (dataToSave[refProp]) {
    // never send _ref to the server
    delete dataToSave[refProp];
  }

  if (model && template) {
    // component has both model and template, so we can do optimistic save + re-rendering
    console.log('1) optimistic rerender: ' + getComponentName(uri))
    promise = clientSave(uri, dataToSave, oldData, store);
  } else if (template) {
    // component only has handlebars template, but still has a server.js.
    // send data to the server, then re-render client-side with the returned data
    console.log('2) server.js: ' + getComponentName(uri))
    promise = serverSave(uri, dataToSave, oldData, store);
  } else {
    // component has server dependencies for their logic (server.js) and template.
    // send data to the server and get the new html back, then send an extra GET to update the store
    console.log('3) server template: ' + getComponentName(uri))
    promise = serverSaveAndRerender(uri, dataToSave, oldData, store);
  }

  return promise;
}

/**
 * remove a component from its parent
 * note: removes from parent component OR page
 * @param  {object} store
 * @param  {Element} el    inside the component to delete
 * @return {Promise}
 */
export function removeComponent(store, el) {
  console.log('component', getComponentEl(el))
  console.log('parent', getParentComponent(getComponentEl(el)))
  console.log('prev', getPrevComponent(getComponentEl(el)))
  const componentEl = getComponentEl(el),
    uri = componentEl.getAttribute(refAttr),
    parentEl = getParentComponent(componentEl),
    parentURI = parentEl.getAttribute(layoutAttr) || parentEl.getAttribute(refAttr),
    path = componentEl.parentNode.getAttribute(editAttr),
    list = getData(parentURI, path),
    prevURI = getPrevComponent(componentEl) && getPrevComponent(componentEl).getAttribute(refAttr);

  let newList = [],
    promise;

  if (_.isArray(list)) {
    // list in a component
    let currentData = _.find(list, (item) => item[refProp] === uri);

    newList = _.without(list, currentData);
    promise = saveComponent(store, { uri: parentURI, data: { [path]: newList } });
  } else if (_.isString(list)) {
    // list in a page
    newList = _.without(list, uri); // we only need the uri, not a full object
    // manually remove component from dom, then update the page data
    removeElement(componentEl);
    promise = store.dispatch('savePage', { [path]: newList });
  }

  return promise.then(() => {
    return find(`[${refAttr}="${prevURI}"]`);
  });
}

/**
 * add a component to its parent
 * note: adds to parent component OR page
 * @param  {object} store
 * @param {string} [currentURI] if adding after a specific component
 * @param {string} parentURI
 * @param {string} path
 * @param {string} uri of the component to add
 * @return {Promise} with the new component's el
 */
export function addComponent(store, { currentURI, parentURI, path, uri }) {
  const data = getData(parentURI, path);

  let promise;

  if (_.isArray(data)) {
    // list in a component
    const index = _.findIndex(data, (item) => item[refProp] === currentURI) || data.length - 1,
      newList = _.slice(data, 0, index + 1).concat([{ [refProp]: uri }]).concat(_.slice(data, index + 1));

    promise = store.dispatch('saveComponent', { uri: parentURI, data: { [path]: newList } });
  } else if (_.isObject(data)) {
    // prop in component
    promise = store.dispatch('saveComponent', { uri: parentURI, data: { [path]: { [refProp]: uri } } });
  } else if (_.isString(data)) {
    // list in a page
    const index = _.findIndex(data, currentURI) || data.length - 1,
      newList = _.slice(data, 0, index + 1).concat([uri]).concat(_.slice(data, index + 1));

    // todo: add actual element to the dom, so we don't have to do a page reload
    promise = store.dispatch('savePage', { [path]: newList });
  }

  return promise.then(() => {
    return find(`[${refAttr}="${uri}"]`);
  });
}

/**
 * get default data for a component, from the store or an api call
 * @param  {string} name
 * @param  {object} store
 * @return {Promise}
 */
function getDefaultData(name, store) {
  const prefix = _.get(store, 'state.site.prefix'),
    defaultURI = `${prefix}${componentRoute}${name}`,
    data = getData(defaultURI);

  if (data) {
    return Promise.resolve(data);
  } else {
    // get default data from the server
    return getObject(defaultURI).then((res) => {
      store.commit(ADD_DEFAULT_DATA, { uri: defaultURI, data: res });
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
function resolveSchema(name, store) {
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
          mapping[`${key}[${index}].${refProp}`] = getComponentName(item[refProp]);
        }
      });
    } else if (_.isObject(val)) {
      if (val[refProp] && isDefaultComponent(val[refProp])) {
        mapping[`${key}.${refProp}`] = getComponentName(val[refProp]);
      }
    }
  });

  return mapping;
}

/**
 * create a component's children, then create the component with their uris
 * @param {string} uri instance uri
 * @param {object} defaultData
 * @param {object} children
 * @param {object} store
 * @returns {Promise} with final component data
 */
function createComponentAndChildren(uri, defaultData, children, store) {
  const prefix = _.get(store, 'state.site.prefix');

  let promises = {};

  _.forOwn(children, (val, key) => {
    promises[key] = getDefaultData(val, store).then((childDefaultData) => {
      const childInstanceURI = `${prefix}${componentRoute}${val}${instancesRoute}`;

      return props({
        schema: resolveSchema(val, store),
        data: create(childInstanceURI, childDefaultData)
      }).then((res) => {
        store.commit(CREATE_COMPONENT, { uri: res.data[refProp], data: res.data });
        return res.data[refProp];
      });
    });
  });

  // once we have the created component refs, we can add them to the current component
  // and POST the final component data (including proper child refs)
  return props(promises).then((childRefs) => {
    _.forOwn(childRefs, (val, key) => {
      _.set(defaultData, key, val);
    });

    return props({
      schema: resolveSchema(getComponentName(uri), store),
      data: create(uri, defaultData)});
  });
}

/**
 * create a component (and its children, if it has children that must be created)
 * then populate the store and return its uri
 * @param  {object} store
 * @param  {string} name
 * @param  {object} [defaultData]
 * @return {Promise}
 */
export function createComponent(store, { name, defaultData }) {
  const prefix = _.get(store, 'state.site.prefix'),
    instanceURI = `${prefix}${componentRoute}${name}${instancesRoute}`;

  if (defaultData) {
    // we passed in data! use it to create the instance
    defaultData = Promise.resolve(defaultData);
  } else {
    defaultData = getDefaultData(name, store);
  }

  return defaultData.then((data) => {
    const children = getChildComponents(data);

    let promise;

    if (_.size(children)) {
      // component we're creating has children which should be created!
      promise = createComponentAndChildren(instanceURI, data, children, store);
    } else {
      promise = props({
        schema: resolveSchema(name, store),
        data: create(instanceURI, data)
      });
    }

    return promise.then((res) => {
      store.commit(CREATE_COMPONENT, { uri: res.data[refProp], data: res.data });
      return res.data[refProp];
    });
  });
}

/**
 * open the add components pane, or add a new components
 * @param  {object} store
 * @param  {string} [currentURI] if we're inserting after a specific component
 * @param  {string} parentURI
 * @param  {string} path
 * @returns {Promise}
 */
export function openAddComponents(store, { currentURI, parentURI, path }) {
  const schema = getSchema(parentURI, path),
    config = schema[componentListProp] || schema[componentProp],
    allComponents = _.get(store, 'state.locals.components'),
    include = config.include,
    exclude = config.exclude,
    isFuzzy = config.fuzzy;

  let available;

  // figure out what components should be available for adding
  if (include && include.length) {
    available = getAvailableComponents(include, exclude);
  } else {
    available = getAvailableComponents(allComponents, exclude);
  }

  if (available.length === 1) {
    // if there's only one available kind of component to add, simply add it
    return store.dispatch('createComponent', { name: _.head(available) })
      .then((uri) => {
        return store.dispatch('addComponent', {
          currentURI: currentURI,
          parentURI: parentURI,
          path: path,
          uri
        });
      });
  } else {
    // open the add components pane
    return store.dispatch('openPane', {
      title: 'Add Component',
      position: 'right',
      content: {
        component: 'add-component',
        args: {
          currentURI,
          parentURI,
          path,
          available,
          isFuzzy,
          allComponents
        }
      }
    });
  }
}
