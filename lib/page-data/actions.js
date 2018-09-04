import _ from 'lodash';
import { replaceVersion } from 'clayutils';
import { UPDATE_PAGE, REVERT_PAGE, PAGE_PUBLISH, PAGE_SCHEDULE, PAGE_UNPUBLISH, PAGE_UNSCHEDULE } from './mutationTypes';
import { save, create, getObject, removeText, remove, getHTML, getMeta } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import { pagesRoute, refProp, htmlExt, editExt, urisRoute, scheduleRoute } from '../utils/references';
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
  return !!_.find(paths, (path) => !_.includes(internalPageProps, path));
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
        return store.dispatch('render', { uri, html, snapshot, paths });
      }
    })
    .catch((e) => {
      store.commit(REVERT_PAGE, oldData);
      logSaveError(uri, e, data, snapshot, store);
      if (shouldRender(paths)) {
        return store.dispatch('render', { uri, html: document, snapshot, paths });
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
  const oldData = _.get(store, 'state.page.data'),
    dataToSave = _.assign({}, oldData, data),
    uri = _.get(store, 'state.page.uri'),
    // figure out what properties we've changed
    // (note: this does a shallow comparison, not deep)
    paths = _.reduce(data, (result, val, key) => _.isEqual(val, oldData[key]) ? result : result.concat(key), []);

  store.dispatch('startProgress', 'save');

  return queuePageSave(uri, dataToSave, oldData, store, {snapshot, paths});
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
    .then((data) => create(`${prefix}${pagesRoute}`, data))
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
 * manually publish the page
 * @param  {object} store
 * @param  {string} uri
 * @return {Promise}
 */
export function publishPage(store, uri) {
  const scheduledPageUri = `${uri}@scheduled`,
    isScheduled = _.get(store, 'state.page.state.scheduled');

  let promise;

  store.dispatch('startProgress', 'published');

  // unschedule, then publish the page
  if (isScheduled) {
    promise = unschedulePage(store);
  } else {
    promise = Promise.resolve(); // do nothing
  }

  return promise.then(() => {
    return addToQueue(save, [`${replaceVersion(uri, 'published')}`], 'published')
      .then((page) => {
        const url = page.url;

        store.commit(PAGE_PUBLISH, { url, date: new Date() });
        return url;
      });
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
  store.dispatch('startProgress', 'published');
  return getMeta(replaceVersion(uri))
    .then((pageMeta) => urlToUri(pageMeta.url))
    .then((publishedURI) => removeURI(publishedURI, store))
    .then(() => store.commit(PAGE_UNPUBLISH))
    .then(() => store.dispatch('finishProgress', 'draft'));
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
  }).then(() => store.commit(PAGE_SCHEDULE, { date: timestamp }))
    .then(() => store.dispatch('finishProgress', 'scheduled'));
}

/**
 * unschedule the page
 * @param  {object} store
 * @return {Promise}
 */
export function unschedulePage(store) {
  const scheduleId = btoa(_.get(store, 'state.page.uri')),
    prefix = _.get(store, 'state.site.prefix'),
    scheduleUri = `${prefix}${scheduleRoute}/${scheduleId}`;

  store.dispatch('startProgress', 'scheduled');
  return remove(scheduleUri)
    .then(() => store.commit(PAGE_UNSCHEDULE))
    .then(() => store.dispatch('finishProgress', 'scheduled'));
}
