import _ from 'lodash';
import { removeElement, find } from '@nymag/dom';
import { UPDATE_COMPONENT, REVERT_COMPONENT, REMOVE_COMPONENT, CURRENTLY_SAVING, OPEN_ADD_COMPONENT, CLOSE_ADD_COMPONENT } from './mutationTypes';
import { getData, getSchema } from '../core-data/components';
import { getComponentName, refProp, refAttr, layoutAttr, editAttr, componentListProp, componentProp } from '../utils/references';
import { save as modelSave, render as modelRender } from './model';
import { save } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import label from '../utils/label';
import { getComponentEl, getParentComponent, getPrevComponent, isComponentInPage } from '../utils/component-elements';
import getAvailableComponents from '../utils/available-components';
import create from './create';
import { getComponentRef, getComponentListStartFromComponent } from '../utils/head-components';
import { publish } from './pubsub';
import logger from '../utils/log';

const log = logger(__filename);

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
      store.commit(UPDATE_COMPONENT, {uri, data: renderableData});
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
 * @return {Promise}
 */
export function saveComponent(store, {uri, data, eventID, snapshot, prevData}) {
  const oldData = prevData || getData(uri),
    // figure out what properties we've changed
    // (note: this does a shallow comparison, not deep)
    paths = _.reduce(data, (result, val, key) => _.isEqual(val, oldData[key]) ? result : result.concat(key), []),
    isPageSpecificComponent = isComponentInPage(uri);

  let dataToSave = _.assign({}, oldData, data),
    promise;

  if (_.isEmpty(paths)) {
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

  // set the updatedTime and user in the page every time we update a component
  // note: only set this for components in the page, not components in the layout
  if (isPageSpecificComponent) {
    store.dispatch('updatePageList');
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
 * @param  {Element} el    inside the component to delete
 * @return {Promise}
 */
export function removeComponent(store, el) {
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
  } else if (_.isObject(list)) {
    promise = saveComponent(store, { uri: parentURI, data: { [path]: {} }});
  } else if (_.isString(list)) {
    // list in a page
    newList = _.without(list, uri); // we only need the uri, not a full object
    // manually remove component from dom, then update the page data
    removeElement(componentEl);
    promise = store.dispatch('savePage', { [path]: newList });
  }

  return promise.then(() => {
    store.commit(REMOVE_COMPONENT, {uri});
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
    layoutURI = _.get(store, 'state.page.data.layout'),
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
    store.commit(REMOVE_COMPONENT, {uri});
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
    index = _.findIndex(data, uri);
  } else {
    // array of objects with refs
    index = _.findIndex(data, (item) => item[refProp] === uri);
  }

  // 0 is a perfectly valid index! (so we can't just check for falsy)
  // note: check for uri first, since if we know we're adding it to the end we don't
  // want to search through the whole array
  return uri && index > -1 ? index : data.length - 1;
}

/**
 * add one or more components to a component list
 * @param {object} store
 * @param {array} data       list data
 * @param {string} [currentURI] if you want to add after / replace a specific current component
 * @param {string} parentURI
 * @param {string} path       of the list
 * @param {boolean} [replace]    to replace currentURI
 * @param {boolean} [clone] to clone ALL child component references, not just default instances
 * @param {array} components with { name, [data] }
 * @returns {Promise}
 */
function addComponentsToComponentList(store, data, {currentURI, parentURI, path, replace, components, clone}) {
  const index = findIndex(data, currentURI); // get the index before we manipulate the list

  return create(components, clone)
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
          store.commit(REMOVE_COMPONENT, { uri: currentURI });
        }
        // return the LAST element added
        return find(`[${refAttr}="${_.last(newComponents)[refProp]}"]`);
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
 * @param {boolean} [clone] to clone ALL child component references, not just default instances
 * @returns {Promise}
 */
function addComponentsToComponentProp(store, data, {parentURI, path, components, clone}) {
  const oldURI = _.get(data, `${path}.${refProp}`);

  if (components.length > 1) {
    log.warn(`Attempting to add multiple components to a component prop: ${getComponentName(parentURI)} » ${path}. Only the first component (${_.head(components).name}) will be added!`, { action: 'addComponentsToComponentProp' });
  }

  // only create the first one
  return create([_.head(components)], clone).then((newComponents) => {
    return store.dispatch('saveComponent', { uri: parentURI, data: { [path]: _.head(newComponents) } }).then(() => {
      if (oldURI) {
        store.commit(REMOVE_COMPONENT, { uri: oldURI });
      }
      // return the LAST element added
      return find(`[${refAttr}="${_.head(newComponents)[refProp]}"]`);
    });
  });
}

/**
 * add one or more components to a page area
 * @param {object} store
 * @param {string} currentURI
 * @param {string} path
 * @param {boolean} replace
 * @param {array} components
 * @param {boolean} [clone] to clone ALL child component references, not just default instances
 * @returns {Promise}
 */
function addComponentsToPageArea(store, {currentURI, path, replace, components, clone}) {
  const data = _.get(store, `state.page.data[${path}]`),
    index = findIndex(data, currentURI); // get the index before we manipulate the list

  return create(components, clone)
    .then((newComponents) => {
      // note: we have to explicitly save these (rather than relying on the cascading PUT of the parent),
      // because they exist in page data
      return Promise.all(_.map(newComponents, (component) => {
        const uri = component[refProp];

        delete component[refProp]; // remove uri from actual data, since we're not doing a cascading PUT
        return modelSave(uri, component)
          .then((savedData) => addToQueue(save, [uri, savedData, false], 'save'))
          .then((savedData) => publish(uri, savedData, null, false, store))
          .then((savedData) => modelRender(uri, savedData))
          .then((savedData) => store.commit(UPDATE_COMPONENT, {uri, data: savedData}))
          .then(() => uri);
      }))
        .then((uris) => {
          // todo: add actual element to the dom, so we don't have to do a page reload
          if (replace) {
            // replace current uri when creating new list
            return _.slice(data, 0, index).concat(uris).concat(_.slice(data, index + 1));
          } else {
            // just add new components after the index
            return _.slice(data, 0, index + 1).concat(uris).concat(_.slice(data, index + 1));
          }
        })
        .then((newList) => {
          if (replace) {
            store.commit(REMOVE_COMPONENT, { uri: currentURI });
          }
          // save page
          // todo: add actual element to the dom, so we don't have to do a page reload
          return store.dispatch('savePage', { [path]: newList });
        });
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
 * @param {boolean} [clone] to clone ALL child component references, not just default instances
 * @param {array} components to add (object with name and [data])
 * @return {Promise} with the last added component's el
 */
export function addComponents(store, { currentURI, parentURI, path, replace, components, clone }) {
  let data = getData(parentURI, path);

  if (!data) {
    // look in the schema to see what this should be
    const schema = getSchema(parentURI, path);

    // depending on whether it's a list or property, add empty data
    data = _.has(schema, componentListProp) ? [] : {};
  }

  if (replace !== true) {
    // only replace if we're explicitly passed true
    replace = false;
  }

  store.commit('CREATE_COMPONENTS', _.map(components, (component) => component.name).join(', '));
  return store.dispatch('unfocus').then(() => {
    if (_.isArray(data)) {
      // list in a component
      return addComponentsToComponentList(store, data, {currentURI, parentURI, path, replace, components, clone});
    } else if (_.isObject(data)) {
      // prop in a component
      return addComponentsToComponentProp(store, data, {parentURI, path, components, clone}); // note: it'll replace whatever's in the prop
    } else if (_.isString(data)) {
      // list in a page (the string is an alias to a page area)
      return addComponentsToPageArea(store, {currentURI, path, replace, components, clone});
    };
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

export function closeAddComponent(store) {
  store.commit(CLOSE_ADD_COMPONENT);
}
