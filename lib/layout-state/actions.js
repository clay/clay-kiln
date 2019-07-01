import _ from 'lodash';
import { replaceVersion } from 'clayutils';
import {
  save, create, remove, getMeta, saveMeta
} from '../core-data/api';
import { UPDATE_LAYOUT_STATE } from './mutationTypes';
import { scheduleRoute } from '../utils/references';
import { uriToUrl } from '../utils/urls';
import { updateStateWithAction } from '../utils/history';

/**
 * @module layout-state
 */

const saveLayoutMeta = _.debounce((uri, data, store) => {
  return saveMeta(uri, data).then((response) => {
    store.commit(UPDATE_LAYOUT_STATE, response);
  }).catch(console.error);
}, 500);

/**
 * get the list data for a specific layout
 * note: if prefix / uri is specified, this does NOT commit the data (only returns it),
 * allowing the preloader to use it when doing the initial preload of data
 * @param {object} store
 * @param {object} [preloadOptions]
 * @param  {string} [preloadOptions.uri]
 * @param {string} [preloadOptions.prefix]
 * @param {object} [preloadOptions.user]
 * @return {Promise}
 */
export function fetchLayoutState(store, preloadOptions = {}) {
  const layoutUri = replaceVersion(preloadOptions.uri || _.get(store, 'state.layout.uri'));

  return getMeta(layoutUri)
    .then((layoutMeta = {}) => {
      if (preloadOptions && _.isEmpty(layoutMeta)) {
        return updateLayout(store, {}, preloadOptions);
      } else if (preloadOptions) {
        return layoutMeta; // called by preloader, so it'll do a single big commit with the whole state
      } else {
        // simply commit the data into the store
        store.commit(UPDATE_LAYOUT_STATE, layoutMeta);
      }
    })
    .catch(() => {
      if (preloadOptions) {
        return {};
      } else {
        store.commit(UPDATE_LAYOUT_STATE, {});
      }
    });
}

/**
 * update a layout's title, or just the latest timestamp + user
 * @param {object} store
 * @param {object} [data]
 * @param {string} [data.title]
 * @param {object} [preloadOptions]
 * @return {Promise}
 */
export function updateLayout(store, data, preloadOptions = {}) {
  const layoutUri = replaceVersion(preloadOptions.uri || _.get(store, 'state.layout.uri'));

  let currentState = _.get(store, 'state.layout.state', {}),
    currentUser = preloadOptions.user || _.get(store, 'state.user'),
    // update the timestamp, users, history and title if they exist
    newState = _.assign({}, updateStateWithAction(currentState, currentUser), data);

  // only send the fields that were updated as this is a PATCH request
  return saveLayoutMeta(layoutUri, newState, store);
}

/**
 * schedule the layout and update its index
 * @param  {object} store
 * @param  {Date} timestamp
 * @return {Promise}
 */
export function scheduleLayout(store, { timestamp }) {
  const prefix = _.get(store, 'state.site.prefix'),
    layoutUri = replaceVersion(_.get(store, 'state.layout.uri')),
    scheduleUri = `${prefix}${scheduleRoute}`;

  store.dispatch('startProgress', 'scheduled');

  return create(scheduleUri, {
    at: timestamp,
    publish: uriToUrl(layoutUri)
  })
    .then(() => getMeta(layoutUri))
    .then(layoutMeta => store.commit(UPDATE_LAYOUT_STATE, layoutMeta))
    .then(() => store.dispatch('finishProgress', 'scheduled'));
}

/**
 * unschedule the layout
 * get updated layout state if the call wasn't made during layout publish
 * @param  {object} store
 * @param  {Boolean} [publishing]
 * @return {Promise}
 */
export function unscheduleLayout(store, publishing = false) {
  const layoutUri = _.get(store, 'state.layout.uri'),
    scheduleId = btoa(layoutUri),
    prefix = _.get(store, 'state.site.prefix'),
    scheduleUri = `${prefix}${scheduleRoute}/${scheduleId}`;

  store.dispatch('startProgress', 'scheduled');

  return remove(scheduleUri)
    .then(() => {
      if (publishing) {
        return Promise.resolve();
      }

      return getMeta(layoutUri);
    })
    .then((layoutMeta) => {
      store.dispatch('finishProgress', 'scheduled');

      if (publishing) {
        return;
      }

      store.commit(UPDATE_LAYOUT_STATE, layoutMeta);
    });
}

/**
 * publish layout
 * note: layouts index is updated server-side, including unscheduling the layout
 * if it's currently scheduled
 * also note: this will trigger a fetch of the updated (published) layout state
 * @param  {object} store
 * @return {Promise}
 */
export function publishLayout(store) {
  const layoutUri = _.get(store, 'state.layout.uri'),
    isScheduled = _.get(store, 'state.layout.state.scheduled');

  let promise;

  store.dispatch('startProgress', 'published');

  // unschedule if scheduled, but don't update the state yet
  if (isScheduled) {
    promise = unscheduleLayout(store, true);
  } else {
    promise = Promise.resolve();
  }

  return promise.then(() => {
    return save(replaceVersion(layoutUri, 'published')) // PUT @published with empty data, and it'll clone the latest data
      .then(() => getMeta(layoutUri)) // fetch updated state
      .then(updatedState => store.commit(UPDATE_LAYOUT_STATE, updatedState))
      .then(() => store.dispatch('finishProgress', 'published'));
  });
}
