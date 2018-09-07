import _ from 'lodash';
import { replaceVersion } from 'clayutils';
import { getMeta, saveMeta } from '../core-data/api';
import updatedStore from '../core-data/store';
import { UPDATE_PAGE_STATE } from './mutationTypes';
import { add as addToQueue } from '../core-data/queue';
import { updateStateWithEditAction } from '../utils/history';

/**
 * @module page-state
 */

/**
 * run page list updates sequentially, grabbing from the store after each to prevent race conditions
 * @param  {string} prefix
 * @param  {string} uri
 * @param  {object} data
 * @return {Promise}
 */
function sequentialUpdate(prefix, uri, data) {
  let currentState = _.get(updatedStore, 'state.page.state'),
    currentUser = data.user || _.get(updatedStore, 'state.user'), // grab this (if it exists), so we can omit it from the data
    newState = _.assign({}, updateStateWithEditAction(currentState, currentUser), data);

  return saveMeta(replaceVersion(uri), newState)
    .then((response) => {
      updatedStore.commit(UPDATE_PAGE_STATE, response);
    }).catch(console.error);
}

/**
 * update page list with data provided from pubsub
 * note: if called without data, this just updates the updateTime and user
 * (e.g. when saving components in the page)
 * note: if called with a user, it adds the user (with updateTime) to the page (instead of current user)
 * @param  {object} store
 * @param  {object} [data]
 * @returns {Promise}
 */
export function updatePageList(store, data = {}) {
  const prefix = _.get(store, 'state.site.prefix'),
    uri = _.get(store, 'state.page.uri');

  return addToQueue(sequentialUpdate, [prefix, uri, data], 'save');
}

/**
 * get the list data for a specific page
 * note: if prefix is specified, this does NOT commit the data (only returns it),
 * allowing the preloader to use it when doing the initial preload of data
 * @param {object} store
 * @param  {string} uri
 * @param {string} [prefix] passed in when preloading (e.g. if site isn't in store yet)
 * @return {Promise}
 */
export function getListData(store, { uri, prefix }) {
  return getMeta(replaceVersion(uri))
    .then((pageState = {}) => {
      if (prefix) {
        return pageState; // called by preloader, so it'll do a single big commit with the whole state
      } else {
        // simply commit the data into the store
        store.commit(UPDATE_PAGE_STATE, pageState);
      }
    })
    .catch(() => {
      if (prefix) {
        return {};
      } else {
        store.commit(UPDATE_PAGE_STATE, {});
      }
    });
}
