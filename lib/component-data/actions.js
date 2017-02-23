import _ from 'lodash';
import { COMPONENT_SAVE_PENDING, COMPONENT_SAVE_FAILURE, COMPONENT_SERVER_SAVE_SUCCESS } from './mutationTypes';
import { getData, getModel, getTemplate } from '../core-data/components';
import { getComponentName, refProp } from '../utils/references';
import { save as modelSave, render as modelRender } from './model';
import { render as renderTemplate } from './template';
import { decorateURIAndChildren } from '../decorators';
import { save, saveForHTML, getObject } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';

function logSaveError(uri, e) {
  return console.error(`Error saving component (${getComponentName(uri)}):`, e);
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
          logSaveError(uri, e);
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
      logSaveError(uri, e);
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
          decorateURIAndChildren(uri, html); // decorate AFTER getting new data
          return res;
        })
        // if that all works, COMPONENT_SERVER_SAVE_SUCCESS
        .then((res) => {
          store.commit(COMPONENT_SERVER_SAVE_SUCCESS, {uri, data: res});
          return res;
        })
        // otherwise revert the data
        .catch((e) => {
          store.commit(COMPONENT_SAVE_FAILURE, {uri, oldData});
          logSaveError(uri, e);
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

  if (dataToSave[refProp]) {
    // never send _ref to the server
    delete dataToSave[refProp];
  }

  let promise;

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
