import _ from 'lodash';
import { SAVE_PENDING, SAVE_SUCCESS, SAVE_FAILURE } from './mutationTypes';
import { getData, getModel, getTemplate } from '../core-data/components';
import { getComponentName } from '../utils/references';
import { save as modelSave, render as modelRender } from './model';
import { render as renderTemplate } from './template';

/**
 * save data client-side and queue up api call for the server
 * note: this uses the components' model.js and handlebars template
 * @param  {string} uri
 * @param  {object} data
 * @param {object} store
 * @return {Promise}
 */
function clientSave(uri, data) {
  return modelSave(uri, data)
    .then((savedData) => savedData) // queue up api PUT
    .then((savedData) => modelRender(uri, savedData))
    .then((renderableData) => store.commit(SAVE_PENDING, uri, renderableData))
    .then((renderableData) => renderTemplate(uri, renderableData));
    // .then(replace component instance element(s) with new rendered element)
    // .then(run decorators for that component instance)
}

/**
 * save data server-side, but re-render client-side afterwards
 * note: this uses deprecated server.js, but renders with handlebars template
 * @param  {string} uri
 * @param  {object} data
 * @return {Promise}
 */
function serverSave(uri, data) {
  return Promise.resolve();
}

/**
 * save data AND re-render server-side
 * note: this uses deprecated server.js and deprecated server-dependent template
 * @param  {string} uri
 * @param  {object} data
 * @return {Promise}
 */
function serverSaveAndRerender(uri, data) {
  return Promise.resolve();
}

/**
 * save a component's data and re-render
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

  if (model && template) {
    // component has both model and template, so we can do optimistic save + re-rendering
    console.log('1) optimistic rerender: ' + getComponentName(uri))
    promise = clientSave(uri, dataToSave, store);
  } else if (template) {
    // component only has handlebars template, but still has a server.js.
    // send data to the server, then re-render client-side with the returned data
    console.log('2) server.js: ' + getComponentName(uri))
    promise = serverSave(uri, dataToSave, store);
  } else {
    // component has server dependencies for their logic (server.js) and template.
    // send data to the server and get the new html back, then send an extra GET to update the store
    console.log('3) server template: ' + getComponentName(uri))
    promise = serverSaveAndRerender(uri, dataToSave, store);
  }

  return promise.then(() => store.commit(SAVE_SUCCESS, uri)).catch((e) => {
    console.error(`Error saving component (${getComponentName(uri)}): ${e.message}`);
    // todo: display this error to user
    store.commit(SAVE_FAILURE, uri, oldData);
  });
}
