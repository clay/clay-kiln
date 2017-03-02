import _ from 'lodash';
import { PAGE_SAVE_PENDING, PAGE_SAVE_FAILURE, PAGE_PUBLISH, PAGE_SCHEDULE, PAGE_UNPUBLISH, PAGE_UNSCHEDULE } from './mutationTypes';
import { START_PROGRESS, FINISH_PROGRESS } from '../toolbar/mutationTypes';
import { save, create, getObject, removeText } from '../core-data/api';
import { add as addToQueue } from '../core-data/queue';
import { replaceVersion, pagesRoute, refProp, htmlExt, editExt, urisRoute } from '../utils/references';
import { uriToUrl, urlToUri } from '../utils/urls';
import { props } from '../utils/promises';

function logSaveError(uri, e) {
  console.error('Error saving page:', e);
  store.dispatch('showStatus', { type: 'error', message: 'Changes made to current page were not saved!' });
}

function queuePageSave(uri, data, oldData, store) {
  addToQueue(save, [uri, data])
  // note: we don't care about the data we got back from the api
  .catch((e) => {
    store.commit(PAGE_SAVE_FAILURE, oldData);
    logSaveError(uri, e);
    // todo: handle this better. right now it's just reloading the page,
    // but it should probably figure out what changed and revert it
    window.location.reload();
  });

  store.commit(PAGE_SAVE_PENDING, data);
  return Promise.resolve(data);
}

/**
 * save a page's data, but do not re-render
 * because, uh, that would just be reloading the page
 * @param  {object} store
 * @param  {*} data  to save
 * @return {Promise}
 */
export function savePage(store, data) {
  const oldData = _.get(store, 'state.page.data'),
    dataToSave = _.assign({}, oldData, data),
    uri = _.get(store, 'state.page.uri');

  return queuePageSave(uri, dataToSave, oldData, store);
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
  })
  .catch((e) => {
    console.error('Error publishing page:', e);
    store.dispatch('showStatus', { type: 'error', message: 'Error publising page!'});
    throw e;
  })
  .then((published) => {
    const url = published.page.url;

    store.commit(PAGE_PUBLISH, { url, date: new Date() });
    store.dispatch('showStatus', { type: 'publish', message: 'Published Page!', action: `<a href="${url}">View</a>` });
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
  store.commit(START_PROGRESS, 'draft');

  return getObject(replaceVersion(uri, 'published'))
    .then((publishedData) => urlToUri(publishedData.url))
    .then((publishedURI) => removeURI(publishedURI, store))
    .catch((e) => {
      console.error('Error unpublishing page:', e);
      store.dispatch('showStatus', { type: 'error', message: 'Error unpublishing page!'});
      throw e;
    })
    .then(() => {
      if (_.includes(window.location.href, uriToUrl(uri))) {
        // if we're already looking at /pages/whatever, display the status message
        store.commit(FINISH_PROGRESS, 'draft');
        store.commit(PAGE_UNPUBLISH);
        store.dispatch('showStatus', { type: 'draft', message: 'Unpublished Page!' });
      } else {
        // if we're looking at the published page, navigate to the latest version
        window.location.href = `${uriToUrl(uri)}${htmlExt}${editExt}`;
      }
    });
}
