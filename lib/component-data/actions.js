import _ from 'lodash';
import { removeElement, find } from '@nymag/dom';
import { isPage } from 'clayutils';
import { UPDATE_COMPONENT, REVERT_COMPONENT, REMOVE_COMPONENT, CURRENTLY_SAVING, OPEN_ADD_COMPONENT, CLOSE_ADD_COMPONENT, UPDATE_SCHEMA_PROP, CURRENTLY_RESTORING, COMPONENT_ADDED } from './mutationTypes';
import { getData, getSchema } from '../core-data/components';
import { refProp, refAttr, layoutAttr, editAttr, componentListProp, componentProp, getComponentName } from '../utils/references';
import { save as modelSave, render as modelRender } from './model';
import { save } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import label from '../utils/label';
import { getComponentEl, getParentComponent, getPrevComponent, isComponentInPage, isComponentInHead } from '../utils/component-elements';
import getAvailableComponents from '../utils/available-components';
import create from './create';
import { getComponentRef, getComponentListStartFromComponent, getListsInHead } from '../utils/head-components';
import { publish } from './pubsub';
import logger from '../utils/log';

const log = logger(__filename),
  META_CALL_TIME = 2000, // update page/layout meta less frequently when only saving the updated user and timestamp
  updatePageMeta = _.debounce((store) => store.dispatch('updatePageList'), META_CALL_TIME, { leading: false, trailing: true }),
  updateLayoutMeta = _.debounce((store) => store.dispatch('updateLayout'), META_CALL_TIME, { leading: false, trailing: true });

/**
 * is uri page spectific
 * @param {string} uri
 * @param {object} store
 * @return {boolean}
 */
function isPageSpecific(uri, store) {
  const layoutData = _.get(store, 'state.layout.data'),
    headLists = _.map(getListsInHead(), ({ path, components }) => ({ path, components, isPage: _.isString(layoutData[path]) }));

  if (isComponentInPage(uri)) {
    return true;
  } else if (!isComponentInHead(uri)) { // not in a page-area elem or page head, we know it's definitely in the layout body
    return false;
  } else { // it's a head component, and we need to figure out whether its stored in the layout or page data
    return _.find(headLists, (list) => _.find(list.components, (cmpt) => cmpt.id === uri)).isPage;
  }
}

/**
 * @module component-data
 */

/**
 * log errors when components save and display them to the user
 * @param  {string} uri
 * @param  {Error} e
 * @param {object} data
 * @param {string} [eventID]
 * @param {boolean} [snapshot]
 * @param  {object} store
 */
function logSaveError(uri, e, data, eventID, snapshot, store) { // eslint-disable-line
  log.error(`Error saving component (${getComponentName(uri)}): ${e.message}`, { action: 'saveComponent', uri });
  store.dispatch('finishProgress', 'error');
  store.dispatch('showSnackbar', {
    message: `Error saving ${label(getComponentName(uri))}`,
    action: 'Retry',
    onActionClick: () => store.dispatch('saveComponent', { uri, data, eventID, snapshot })
  });
}

/**
 * re-render (reverting) a component and stop the saving promise chain
 * @param  {string} uri
 * @param  {object} data
 * @param  {boolean} [snapshot]
 * @param  {array} paths
 * @param {object} store
 * @return {Promise}
 */
function revertReject({ uri, data, snapshot, paths, store }) {
  return store.dispatch('render', { uri, data, snapshot, paths })
    .then(() => Promise.reject(new Error(`Save failed, reverting ${uri}`))); // don't continue saving
}


/**
 * update a property value on a component schema
 * @param {object} store
 * @param {string} schemaName
 * @param {string} inputName
 * @param {string} prop
 * @param {object|string|number} value
 * @return{promise}
 */
export function updateSchemaProp(store, { schemaName, inputName, prop, value }) {
  return store.commit(UPDATE_SCHEMA_PROP, { schemaName, inputName, prop, value });
}

/**
 * trigger a the model.save of a component
 * @param {string} uri
 * @param {object} data
 * @return {promise}
 */
export function triggerModelSave(uri, data) {
  return modelSave(uri, data);
}

/**
 * trigger a the model.render of a component
 * @param {object} store
 * @param {string} uri
 * @param {object} data
 * @return {promise}
 */
export function triggerModelRender(store, { uri, data }) {
  return modelRender(uri, data);
}

/**
 * save data client-side and queue up api call for the server
 * note: this uses the components' model.js (if it exists) and handlebars template
 * note: server-side saving and/or re-rendering has been removed in kiln v4.x
 * @param  {string} uri
 * @param  {object} data
 * @param {object} oldData
 * @param {object} store
 * @param {string} [eventID]
 * @param {boolean} [snapshot] passed through to render
 * @param {array} paths
 * @return {Promise}
 */
function clientSave(uri, data, oldData, store, {eventID, snapshot, paths}) { // eslint-disable-line
  return modelSave(uri, data)
    .catch((e) => {
      e.message = `Model.save failed with message: ${e.message}`;
      return Promise.reject(e);
    })
    .then((savedData) => {
      // kick api call off in the background
      addToQueue(save, [uri, savedData, false], 'save') // add hooks=false to prevent models from re-running on server
        // note: we don't care about the data we got back from the api
        .catch((e) => {
          logSaveError(uri, e, data, eventID, snapshot, store);
          store.commit(REVERT_COMPONENT, {uri, oldData});
          return revertReject({ uri, data: oldData, snapshot, paths, store });
        });

      return savedData;
    })
    // publish changes for other components after running through model.save(),
    // but before model.render()
    // note: pubsub is only allowed in components with model.js
    .then((savedData) => publish(uri, savedData, eventID, snapshot, store))
    .then((savedData) => modelRender(uri, savedData))
    .then((renderableData) => {
      if (oldData) {
        const fields = _.reduce(renderableData, (result, val, key) => _.isEqual(val, oldData[key]) ? result : result.concat(key), []);

        store.commit(UPDATE_COMPONENT, {uri, data: renderableData, fields});
      }

      return store.dispatch('render', { uri, data: renderableData, snapshot, paths });
    })
    .catch((e) => {
      // if there are any errors saving, publishing, or re-rendering component,
      // show the end user an error and revert it!
      logSaveError(uri, e, data, eventID, snapshot, store);
      return revertReject({ uri, data: oldData, snapshot, paths, store });
    });
}

/**
 * save a component's data and re-render
 * @param {object} store
 * @param  {string} uri
 * @param  {object} data (may be a subset of the data)
 * @param {string} [eventID] when saving from a pubsub subscription
 * @param {boolean} [snapshot] set to false if save is triggered by undo/redo
 * @param {object} [prevData] manually passed in when undoing/redoing (because the store has already been updated)
 * @param {boolean} forceSave if true, component will be saved even if it doesn't appear to have changed
 * @return {Promise}
 */
export function saveComponent(store, {uri, data, eventID, snapshot, prevData, forceSave = false}) {
  const oldData = prevData || getData(uri),
    // figure out what properties we've changed
    // (note: this does a shallow comparison, not deep)
    paths = _.reduce(data, (result, val, key) => oldData && _.isEqual(val, oldData[key]) ? result : result.concat(key), []),
    isPageSpecificComponent = isPageSpecific(uri, store);

  let dataToSave = _.assign({}, oldData, data),
    promise;

  if (_.isEmpty(paths) && !forceSave) {
    // don't save if nothing has changed!
    // this is an optimization that allows for long pubsub chains without us
    // saving all the components every time if their data hasn't changed
    return Promise.resolve();
  }

  // kick off the save, and don't allow other things to happen
  store.commit(CURRENTLY_SAVING, true);

  // start or briefly pause the progress bar when components are saved.
  // note: bar will finish when all items in the queue are flushed
  store.dispatch('startProgress', 'save');

  // if we're doing a manual save (and we've hit "undo" to get to the current state),
  // we want to make sure we don't have items to "redo" in the history
  if (snapshot !== false) {
    store.dispatch('setFixedPoint');
  }

  // do optimistic save + re-render, passing data through model.save and model.render if they exist
  promise = clientSave(uri, dataToSave, oldData, store, {eventID, snapshot, paths});
  // update the page / layout state every time we update a component.
  if (isPageSpecificComponent) {
    updatePageMeta(store);
  } else {
    updateLayoutMeta(store);
  }

  return promise.then(() => {
    store.commit(CURRENTLY_SAVING, false);
  }).catch(() => {
    // catch failed+reverted component saves, so the rest of the form teardown can happen
    store.commit(CURRENTLY_SAVING, false);
  });
}

/**
 * remove a component from its parent
 * note: removes from parent component OR page
 * @param  {object} store
 * @param  {Element} data   el || {el, msg} where el is the component to delete
 * @return {Promise}
 */
export function removeComponent(store, data) {
  const el = data.el || data,
    componentEl = getComponentEl(el),
    uri = componentEl && componentEl.getAttribute(refAttr),
    parentEl = getParentComponent(componentEl),
    parentURI = parentEl && parentEl.getAttribute(layoutAttr) || parentEl.getAttribute(refAttr),
    path = componentEl && componentEl.parentNode && componentEl.parentNode.getAttribute(editAttr),
    list = getData(parentURI, path),
    prevURI = getPrevComponent(componentEl) && getPrevComponent(componentEl).getAttribute(refAttr),
    msg = data.msg || '';

  let newList = [],
    promise;

  if (_.isArray(list)) {
    // list in a component
    let currentData = _.find(list, (item) => item[refProp] === uri);

    newList = _.without(list, currentData);
    promise = saveComponent(store, { uri: parentURI, data: { [path]: newList } });
  } else if (_.isObject(list)) {
    promise = saveComponent(store, { uri: parentURI, data: { [path]: null }});
  } else if (_.isString(list)) {
    // list in a page
    let pageData = _.get(store, 'state.page.data');

    newList = _.without(pageData[list], uri); // we only need the uri, not a full object
    // manually remove component from dom, then update the page data
    removeElement(componentEl);
    promise = store.dispatch('savePage', { [path]: newList });
  }

  return promise.then(() => {
    const componentName = getComponentName(uri);

    store.commit(REMOVE_COMPONENT, msg ? {uri, msg} : {uri, componentName});
    return find(`[${refAttr}="${prevURI}"]`);
  });
}

/**
 * remove head components (from page or layout)
 * @param  {object} store
 * @param  {Node} startNode comment with data-uri
 * @return {Promise}
 */
export function removeHeadComponent(store, startNode) {
  const uri = getComponentRef(startNode),
    layoutURI = _.get(store, 'state.layout.uri'),
    path = getComponentListStartFromComponent(startNode),
    list = getData(layoutURI, path);

  let newList, promise;

  if (_.isArray(list)) {
    // list in a component (the layout)
    let currentData = _.find(list, (item) => item[refProp] === uri);

    newList = _.without(list, currentData);
    promise = saveComponent(store, { uri: layoutURI, data: { [path]: newList } });
  } else if (_.isString(list)) {
    // list in a page
    let pageList = _.get(store, `state.page.data['${path}']`);

    newList = _.without(pageList, uri); // we only need the uri, not a full object
    promise = store.dispatch('savePage', { [path]: newList });
  }

  return promise.then(() => {
    const componentName = getComponentName(uri);

    store.commit(REMOVE_COMPONENT, {uri, componentName});
  });
}

/**
 * find the index of a uri in a list
 * this is broken out into a separate function so we don't assume an index of 0 is falsy
 * @param  {array} data
 * @param  {string} [uri]
 * @return {number}
 */
function findIndex(data, uri) {
  let index;

  if (_.isString(data[0])) {
    // array of strings!
    index = _.findIndex(data, (item) => item === uri);
  } else {
    // array of objects with refs
    index = _.findIndex(data, (item) => item[refProp] === uri);
  }

  // 0 is a perfectly valid index! (so we can't just check for falsy)
  return index > -1 ? index : data.length - 1;
}

/**
 * add one or more components to a component list
 * @param {object} store
 * @param {array} data       list data
 * @param {string} [currentURI] if you want to add after / replace a specific current component
 * @param {string} parentURI
 * @param {string} path       of the list
 * @param {boolean} [replace]    to replace currentURI
 * @param {array} components with { name, [data] }
 * @returns {Promise}
 */
function addComponentsToComponentList(store, data, {currentURI, parentURI, path, replace, components}) {
  const index = findIndex(data, currentURI); // get the index before we manipulate the list

  return create(components)
    .then((newComponents) => {
      let newList;

      if (replace) {
        // replace current uri when creating new list
        newList = _.slice(data, 0, index).concat(newComponents).concat(_.slice(data, index + 1));
      } else {
        // just add new components after the index
        newList = _.slice(data, 0, index + 1).concat(newComponents).concat(_.slice(data, index + 1));
      }

      return store.dispatch('saveComponent', { uri: parentURI, data: { [path]: newList }}).then(() => {
        if (replace) {
          const componentName = getComponentName(currentURI);

          store.commit(REMOVE_COMPONENT, { uri: currentURI, componentName });
        }

        const newURI = _.last(newComponents)[refProp];

        return store.dispatch('componentAdded', { componentName: getComponentName(newURI), uri: newURI }).then(() => {
          // return the LAST element added
          return find(`[${refAttr}="${newURI}"]`);
        });

      });
    });
}

/**
 * replace a single component in another component's property
 * @param {object} store
 * @param {object} data
 * @param {string} parentURI
 * @param {string} path
 * @param {array} components note: it'll only replace using the first thing in this array
 * @returns {Promise}
 */
function addComponentsToComponentProp(store, data, {parentURI, path, components}) {
  const oldURI = _.get(data, `${path}.${refProp}`);

  if (components.length > 1) {
    log.warn(`Attempting to add multiple components to a component prop: ${getComponentName(parentURI)} » ${path}. Only the first component (${_.head(components).name}) will be added!`, { action: 'addComponentsToComponentProp' });
  }

  // only create the first one
  return create([_.head(components)]).then((newComponents) => {
    return store.dispatch('saveComponent', { uri: parentURI, data: { [path]: _.head(newComponents) } }).then(() => {
      if (oldURI) {
        const componentName = getComponentName(oldURI);

        store.commit(REMOVE_COMPONENT, { uri: oldURI, componentName });
      }
      // return the LAST element added
      return find(`[${refAttr}="${_.head(newComponents)[refProp]}"]`);
    });
  });
}

/**
 * create components to be added to a page area (i.e. head, main, etc.)
 * @param {object} store
 * @param {string} currentURI
 * @param {string} path
 * @param {boolean} replace
 * @param {array} components
 * @returns {Promise}
 */
function addComponentsToPageArea(store, {currentURI, path, replace, components}) {
  const data = _.get(store, `state.page.data[${path}]`),
    index = findIndex(data, currentURI); // get the index before we manipulate the list

  return create(components)
    .then((newComponents) => {
      return store.dispatch('addCreatedComponentsToPageArea', {newComponents, store, currentURI, path, replace, index, data});
    });
}

/**
 * add components to a page area
 * @param {object} store
 * @param {array} newComponents
 * @param {string} currentURI
 * @param {string} path
 * @param {boolean} replace
 * @param {index} number
 * @param {data} array
 * @param {forceRender} boolean
 * @returns {Promise}
 */
export function addCreatedComponentsToPageArea(store, { newComponents,  currentURI, path, replace, index, data, forceRender }) {
  // note: we have to explicitly save these (rather than relying on the cascading PUT of the parent),
  // because they exist in page data
  return Promise.all(_.map(newComponents, (component) => {
    const uri = component[refProp] || currentURI;

    delete component[refProp]; // remove uri from actual data, since we're not doing a cascading PUT

    return modelSave(uri, component)
      .then((savedData) => addToQueue(save, [uri, savedData, false], 'save'))
      .then((savedData) => publish(uri, savedData, null, false, store))
      .then((savedData) => modelRender(uri, savedData))
      .then((savedData) => store.commit(UPDATE_COMPONENT, {uri, data: savedData}))
      .then(() => {
        store.dispatch('componentAdded', { componentName: getComponentName(uri), uri });
        return uri;
      });
  })).then((uris) => {
    // if replace is true, replace current uri when creating new list
    // else just add new components after the index;
    const selectedIndex = replace ? index : index + 1;

    return _.slice(data, 0, selectedIndex).concat(uris).concat(_.slice(data, index + 1));
  })
    .then((newList) => {
      if (replace && currentURI) {
        const componentName = getComponentName(currentURI);

        store.commit(REMOVE_COMPONENT, { uri: currentURI, componentName });
      }

      // save page
      return store.dispatch('savePage', { [path]: newList, forceRender });
    });
}


/**
 * add components to a parent component (or page)
 * note: allows multiple components to be added at once
 * note: always creates new instances of the components you're adding
 * note: allows you to replace a specific uri, or add components after it
 * note: if no currentURI passed in, it will add new components to the end (and won't replace anything)
 * @param  {object} store
 * @param {string} [currentURI] if adding after / replacing a specific component
 * @param {string} parentURI
 * @param {string} path
 * @param {boolean} [replace] to replace the current URI
 * @param {array} components to add (object with name and [data])
 * @return {Promise} with the last added component's el
 */
export function addComponents(store, { currentURI, parentURI, path, replace, components }) {
  if (replace !== true) {
    // only replace if we're explicitly passed true
    replace = false;
  }

  store.commit('CREATE_COMPONENTS', _.map(components, (component) => component.name).join(', '));
  return store.dispatch('unfocus').then(() => {
    if (isPage(parentURI)) {
      // uri is a page, don't try to fetch data or schema
      return addComponentsToPageArea(store, {currentURI, path, replace, components});
    } else {
      // uri is a component (possibly the layout). fetch data and schema to see where component(s) should be added
      let data = getData(parentURI, path);

      if (!data) {
        // look in the schema to see what this should be
        const schema = getSchema(parentURI, path);

        // depending on whether it's a list or property, add empty data
        data = _.has(schema, componentListProp) ? [] : {};
      }

      if (_.isArray(data)) {
        // list in a component
        return addComponentsToComponentList(store, data, {currentURI, parentURI, path, replace, components});
      } else if (_.isObject(data)) {
        // prop in a component
        return addComponentsToComponentProp(store, data, {parentURI, path, components}); // note: it'll replace whatever's in the prop
      } else if (_.isString(data)) {
        // list in a page (the string is an alias to a page area)
        return addComponentsToPageArea(store, {currentURI, path, replace, components});
      };
    }
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
export function openAddComponent(store, { currentURI, parentURI, path, pos }) {
  const schemaURI = isPage(parentURI) ? _.get(store, 'state.layout.uri') : parentURI,
    schema = getSchema(schemaURI, path),
    config = schema[componentListProp] || schema[componentProp],
    allComponents = _.get(store, 'state.locals.components'),
    include = config.include,
    exclude = config.exclude,
    isFuzzy = config.fuzzy;

  let available;

  // figure out what components should be available for adding
  if (include && include.length) {
    available = getAvailableComponents(store, include, exclude);
  } else {
    available = getAvailableComponents(store, allComponents, exclude);
  }

  if (available.length === 1) {
    // if there's only one available kind of component to add, simply add it
    return store.dispatch('unfocus').then(() => store.dispatch('addComponents', {
      currentURI,
      parentURI,
      path: path,
      components: [{ name: _.head(available) }]
    }).then((newEl) => {
      // select component if it isn't a layout or head component
      if (newEl) {
        store.dispatch('select', newEl);
      }
    }));
  } else {
    // open the add components modal
    return store.dispatch('unfocus').then(() => store.commit(OPEN_ADD_COMPONENT, {
      currentURI,
      parentURI,
      path,
      available,
      isFuzzy,
      allComponents,
      pos
    }));
  }
}

/**
 * Store the last item added
 * @param {object} store
 * @param {string} componentName
 * @param {string} uri
 */
export function componentAdded(store, { componentName, uri }) {
  store.commit(COMPONENT_ADDED, { componentName, uri });
}

/**
 * Close the add component
 * @param {object} store
 */
export function closeAddComponent(store) {
  store.commit(CLOSE_ADD_COMPONENT);
}

/**
 * open the add components pane, or add a new components
 * @param  {object} store
 * @param  {boolean} restoring if we're currently restoring a page
 */
export function currentlyRestoring(store, restoring) {
  store.commit(CURRENTLY_RESTORING, restoring);
}
