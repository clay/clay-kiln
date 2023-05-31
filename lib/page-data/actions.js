import _ from 'lodash';
import { replaceVersion } from 'clayutils';
import { UPDATE_PAGE, REVERT_PAGE, IS_PUBLISHING } from './mutationTypes';
import { UPDATE_PAGE_STATE } from '../page-state/mutationTypes';
import {
  save, create, getObject, removeText, remove, getHTML, getMeta, getPrepublishUrl
} from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import {
  pagesRoute, refProp, htmlExt, editExt, urisRoute, scheduleRoute
} from '../utils/references';
import { uriToUrl, urlToUri } from '../utils/urls';
import logger from '../utils/log';

/**
 * @module page-data
 */

// saving these paths should NOT trigger a re-render of the page
const log = logger(__filename),
  internalPageProps = [
    'layout',
    'customUrl',
    'url',
    'urlHistory'
  ];

/**
 * iterate through the paths we're saving
 * if one of them ISN'T in the internalPageProps, we should re-render
 * @param  {array} paths
 * @return {boolean}
 */
function shouldRender(paths) {
  return !!_.find(paths, path => !_.includes(internalPageProps, path));
}

function logSaveError(uri, e, data, snapshot, store) { // eslint-disable-line
  log.error(`Error saving page: ${e.message}`, { action: 'savePage', uri });
  store.dispatch('showSnackbar', { type: 'error', message: 'Changes made to current page were not saved!' });
  store.dispatch('showSnackbar', {
    message: 'Error saving page',
    action: 'Retry',
    onActionClick: () => store.dispatch('savePage', data, snapshot)
  });
}

function queuePageSave(uri, data, oldData, store, {snapshot, paths}) { // eslint-disable-line
  return addToQueue(save, [uri, data, true], 'save')
    .then(() => getHTML(uri))
    .then((html) => {
      // note: we don't care about the data we got back from the api
      store.commit(UPDATE_PAGE, data);
      if (shouldRender(paths)) {
        return store.dispatch('render', {
          uri, html, snapshot, paths
        });
      }
    })
    .catch((e) => {
      store.commit(REVERT_PAGE, oldData);
      logSaveError(uri, e, data, snapshot, store);
      if (shouldRender(paths)) {
        return store.dispatch('render', {
          uri, html: document, snapshot, paths
        });
      }
    });
}

/**
 * save a page's data, but do not re-render
 * because, uh, that would just be reloading the page
 * @param  {object} store
 * @param  {*} data  to save
 * @param {boolean} [snapshot] false if we're undoing/redoing
 * @return {Promise}
 */
export function savePage(store, data, snapshot) {
  let forceRender = data.forceRender || false;

  delete data.forceRender;

  const oldData = _.get(store, 'state.page.data'),
    dataToSave = _.assign({}, oldData, data),
    uri = _.get(store, 'state.page.uri'),
    // figure out what properties we've changed
    // (note: this does a shallow comparison, not deep)
    paths = _.reduce(data, (result, val, key) => _.isEqual(val, oldData[key]) && !forceRender ? result : result.concat(key), []);

  store.dispatch('startProgress', 'save');

  return queuePageSave(uri, dataToSave, oldData, store, { snapshot, paths });
}

/**
 * create a new page, then return its editable link
 * @param  {object} store
 * @param  {string} id
 * @return {Promise}
 */
export function createPage(store, id) {
  const prefix = _.get(store, 'state.site.prefix');

  store.dispatch('startProgress', 'save');

  return getObject(`${prefix}${pagesRoute}${id}`)
    .then(data => create(`${prefix}${pagesRoute}`, data))
    .then((newPage) => {
      store.dispatch('finishProgress', 'save');

      return `${uriToUrl(newPage[refProp])}${htmlExt}${editExt}`;
    })
    .catch((e) => {
      log.error(`Error creating page: ${e.message}`, { action: 'createPage', uri: `${prefix}${pagesRoute}${id}` });
      store.dispatch('finishProgress', 'error');
      store.dispatch('showSnackbar', 'Error creating page');
      throw e;
    });
}

/**
 * set currentlyPublishing in state
 * @param  {object} store
 * @param  {boolean} isPublishing
 */
export function isPublishing(store, isPublishing = false) {
  store.commit(IS_PUBLISHING, isPublishing);
}

/**
 * manually publish the page
 * @param  {object} store
 * @param  {string} uri
 * @return {Promise}
 */
export function publishPage(store, uri) {
  const isScheduled = _.get(store, 'state.page.state.scheduled');

  let promise;

  store.dispatch('startProgress', 'published');

  // unschedule (without updating page state [yet]), then publish the page
  if (isScheduled) {
    promise = unschedulePage(store, true);
  } else {
    promise = Promise.resolve(); // do nothing
  }

  return promise.then(() => {
    return addToQueue(save, [`${replaceVersion(uri, 'published')}`], 'published')
      .then(() => getMeta(uri)) // now we update the page state, which will include the unschedule event (if applicable)
      .then(updatedState => store.commit(UPDATE_PAGE_STATE, updatedState))
      .then(() => store.dispatch('isPublishing', false));
  });
}

/**
 * remove uri from /uris/
 * @param  {String} uri
 * @param  {Object} store
 * @return {Promise}
 */
function removeURI(uri, store) {
  const prefix = _.get(store, 'state.site.prefix');

  return removeText(`${prefix}${urisRoute}${btoa(uri)}`);
}

/**
 * remove uri from /uris/
 * @param  {object} store
 * @param  {string} uri
 * @return {Promise}
 */
export function unpublishPage(store, uri) {
  const url = _.get(store, 'state.page.state.url'),
    publishedURI = urlToUri(url);

  store.dispatch('startProgress', 'published');

  return removeURI(publishedURI, store)
    .then(() => getMeta(replaceVersion(uri)))
    .then((updatedState) => {
      store.commit(UPDATE_PAGE_STATE, updatedState);
      store.dispatch('finishProgress', 'draft');
    });
}

/**
 * schedule the page to publish
 * @param  {object} store
 * @param  {string} uri
 * @param  {Date} timestamp
 * @return {Promise}
 */
export function schedulePage(store, { uri, timestamp }) {
  const prefix = _.get(store, 'state.site.prefix'),
    scheduleUri = `${prefix}${scheduleRoute}`;

  store.dispatch('startProgress', 'scheduled');

  return create(scheduleUri, {
    at: timestamp,
    publish: uriToUrl(uri)
  }).then(() => getMeta(uri))
    .then((updatedState) => {
      getPrepublishUrl(uri, timestamp)
        .then((prepublishUrlResponse) => {
          updatedState.prepublishUrl = prepublishUrlResponse.result;
          console.log(updatedState)

          store.commit(UPDATE_PAGE_STATE, updatedState);
          store.dispatch('finishProgress', 'scheduled');
        })

    });
}

/**
 * unschedule the page
 * get updated page state if the call wasn't made during a page publish
 * @param  {object} store
 * @param  {Boolean} [publishing]
 * @return {Promise}
 */
export function unschedulePage(store, publishing = false) {
  const pageUri = _.get(store, 'state.page.uri'),
    scheduledId = btoa(pageUri),
    prefix = _.get(store, 'state.site.prefix'),
    scheduledUri = `${prefix}${scheduleRoute}/${scheduledId}`;

  store.dispatch('startProgress', 'unscheduled');

  return remove(scheduledUri)
    .then(() => {
      if (publishing) {
        return Promise.resolve();
      }

      // only make this call on a true unschedule event, not an unschedule during publish
      return getMeta(pageUri);
    })
    .then((updatedState) => {
      updatedState.prepublishUrl = '';

      store.dispatch('finishProgress', 'unscheduled');

      if (publishing) {
        return;
      }

      store.commit(UPDATE_PAGE_STATE, updatedState);
    });
}
