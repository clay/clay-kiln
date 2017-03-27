import _ from 'lodash';
import { UPDATE_PAGE, REVERT_PAGE, RENDER_PAGE, PAGE_PUBLISH, PAGE_SCHEDULE, PAGE_UNPUBLISH, PAGE_UNSCHEDULE } from './mutationTypes';
import { save, create, getObject, removeText, remove, getHTML } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import { replaceVersion, pagesRoute, refProp, htmlExt, editExt, urisRoute, scheduleRoute } from '../utils/references';
import { uriToUrl, urlToUri } from '../utils/urls';
import { props } from '../utils/promises';

function logSaveError(uri, e) {
  console.error('Error saving page:', e);
  store.dispatch('showStatus', { type: 'error', message: 'Changes made to current page were not saved!' });
}

function queuePageSave(uri, data, oldData, store, {snapshot, paths}) { // eslint-disable-line
  addToQueue(save, [uri, data])
  .then(() => getHTML(uri))
  .then((html) => {
    // note: we don't care about the data we got back from the api
    store.commit(UPDATE_PAGE, data);
    store.commit(RENDER_PAGE, {html, snapshot, paths});
    return data;
  })
  .catch((e) => {
    store.commit(REVERT_PAGE, oldData);
    store.commit(RENDER_PAGE, {html: document, snapshot, paths});
    logSaveError(uri, e);
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

  return queuePageSave(uri, dataToSave, oldData, store, {snapshot, paths});
}

export function createPage(store, id) {
  const prefix = _.get(store, 'state.site.prefix');

  return getObject(`${prefix}${pagesRoute}${id}`)
    .then((data) => create(`${prefix}${pagesRoute}`, data))
    .then((newPage) => `${uriToUrl(newPage[refProp])}${htmlExt}${editExt}`)
    .catch((e) => {
      console.error('Error creating page:', e);
      store.dispatch('showStatus', { type: 'error', message: 'Error creating page!' });
      throw e;
    });
}

export function publishPage(store, uri) {
  const data = _.get(store, 'state.page.data'),
    layoutUri = data.layout;

  // publish the page and layout
  return props({
    page: addToQueue(save, [`${replaceVersion(uri, 'published')}`, data], 'publish'),
    layout: addToQueue(save, [`${replaceVersion(layoutUri, 'published')}`], 'publish') // PUT @published with empty data, and it'll clone the latest data
  }).then((promises) => {
    const url = promises.page.url;

    store.commit(PAGE_PUBLISH, { url, date: new Date() });
    return url;
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
  return getObject(replaceVersion(uri, 'published'))
    .then((publishedData) => urlToUri(publishedData.url))
    .then((publishedURI) => removeURI(publishedURI, store))
    .then(() => store.commit(PAGE_UNPUBLISH));
}

export function schedulePage(store, { uri, timestamp }) {
  const prefix = _.get(store, 'state.site.prefix'),
    layoutUri = _.get(store, 'state.page.data.layout'),
    scheduleUri = `${prefix}${scheduleRoute}`;

  return props({
    page: create(scheduleUri, {
      at: timestamp,
      publish: uriToUrl(uri)
    }),
    layout: create(scheduleUri, {
      at: timestamp,
      publish: uriToUrl(layoutUri)
    })
  }).then(() => store.commit(PAGE_SCHEDULE, { date: timestamp }));
}

/**
 * if something is scheduled, remove it
 * @param  {string} uri
 * @return {string} schedule entry removed
 */
function unschedule(uri) {
  return remove(uri)
    .then((res) => res[refProp])
    .then((scheduleEntry) => remove(scheduleEntry))
    .catch(_.noop);
}

export function unschedulePage(store) {
  const pageUri = `${_.get(store, 'state.page.uri')}@scheduled`,
    layoutUri = `${_.get(store, 'state.page.data.layout')}@scheduled`;

  return props({
    page: unschedule(pageUri),
    layout: unschedule(layoutUri)
  }).then(() => store.commit(PAGE_UNSCHEDULE));
}
