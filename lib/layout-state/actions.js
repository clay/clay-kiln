import _ from 'lodash';
import { postJSON, save, create, remove } from '../core-data/api';
import { UPDATE_LAYOUT_STATE } from './mutationTypes';
import { searchRoute, replaceVersion, scheduleRoute, refProp } from '../utils/references';
import { uriToUrl } from '../utils/urls';

/**
 * @module layout-state
 */

const postLayoutList = _.debounce((endpoint, data, store) => {
  return postJSON(endpoint, data).then((response) => {
    store.commit(UPDATE_LAYOUT_STATE, response.value);
  }).catch(console.error);
}, 500); // only update the layout list every 500ms

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
  const sitePrefix = preloadOptions.prefix || _.get(store, 'state.site.prefix'),
    layoutUri = preloadOptions.uri || _.get(store, 'state.page.data.layout');

  let query = {
    index: 'layouts',
    body: {
      size: 1,
      query: {
        term: {
          uri: replaceVersion(layoutUri) // match layout uri (removing @published or @scheduled)
        }
      }
    }
  };

  return postJSON(sitePrefix + searchRoute, query)
    .then((res) => _.get(res, 'hits.hits[0]._source'))
    .then((layoutState = {}) => {
      if (preloadOptions && _.isEmpty(layoutState)) {
        return updateLayout(store, {}, preloadOptions);
      } else if (preloadOptions) {
        return layoutState; // called by preloader, so it'll do a single big commit with the whole state
      } else {
        // simply commit the data into the store
        store.commit(UPDATE_LAYOUT_STATE, layoutState);
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
 * updates the state's history array to make sure the latest item is an
 * 'edit' event that includes the current user
 * note: this function is only exported for testing purposes, and should not be used by other modules
 * @param  {object} state
 * @param  {object} currentUser
 * @return {object}
 */
export function updateHistoryWithEditAction(state, currentUser) {
  let history = state.history ? _.cloneDeep(state.history) : [],
    latest,
    userIndex;

  // If history is empty or the latest item is not an edit event, add a new edit event
  if (history.length === 0 || history[history.length - 1].action !== 'edit') {
    history.push({
      action: 'edit',
      timestamp: new Date(),
      users: [currentUser]
    });
  // latest item is an edit event, and but it doesn't contain this user, add the user to the event
  } else {
    latest = history[history.length - 1];
    userIndex = _.findIndex(latest.users, (user) => user.username === currentUser.username);

    if (userIndex === -1) {
      latest.users.push(currentUser);
    } else if (userIndex > -1) {
      // if the current user is in the list, but isn't at the end, we should move it to the end
      latest.users.splice(userIndex, 1); // remove user from list
      latest.users.push(currentUser); // and add it to the end
    }
    latest.timestamp = new Date();
  }

  return history;
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
  const prefix = preloadOptions.prefix || _.get(store, 'state.site.prefix'),
    layoutUri = preloadOptions.uri || _.get(store, 'state.page.data.layout');

  let currentState = _.get(store, 'state.layout', {}),
    updateTime = new Date(),
    currentUser = preloadOptions.user || _.get(store, 'state.user'),
    title = data && data.title,
    // update the timestamp, user, and title if they exist
    newState = _.assign({}, currentState, {
      updateTime,
      updateUser: currentUser,
      title
    });

  newState.history = updateHistoryWithEditAction(newState, currentUser);

  return postLayoutList(`${prefix}/_layoutlist`, {
    uri: layoutUri,
    value: newState
  }, store);
}

/**
 * schedule the layout and update its index
 * @param  {object} store
 * @param  {Date} timestamp
 * @return {Promise}
 */
export function scheduleLayout(store, { timestamp }) {
  const prefix = _.get(store, 'state.site.prefix'),
    layoutUri = _.get(store, 'state.page.data.layout'),
    scheduleUri = `${prefix}${scheduleRoute}`;

  store.dispatch('startProgress', 'scheduled');
  return create(scheduleUri, {
    at: timestamp,
    publish: uriToUrl(layoutUri)
  }).then(() => {
    let currentState = _.get(store, 'state.layout', {}),
      currentUser = _.get(store, 'state.user'),
      // add schedule action to the history
      newState = _.assign({}, currentState, {
        scheduled: true,
        scheduleTime: timestamp,
        history: (currentState.history || []).concat([{
          action: 'schedule',
          timestamp: new Date(),
          scheduleTime: timestamp,
          users: [currentUser]
        }]
        )});

    return postLayoutList(`${prefix}/_layoutlist`, {
      uri: layoutUri,
      value: newState
    }, store);
  }).then(() => store.dispatch('finishProgress', 'scheduled'));
}

/**
 * unschedule the layout and update its index
 * @param  {object} store
 * @return {Promise}
 */
export function unscheduleLayout(store) {
  const prefix = _.get(store, 'state.site.prefix'),
    layoutUri = `${_.get(store, 'state.page.data.layout')}@scheduled`;

  store.dispatch('startProgress', 'scheduled');
  return remove(layoutUri)
    .then((res) => res[refProp])
    .then((scheduleEntry) => remove(scheduleEntry))
    .catch(_.noop)
    .then(() => {
      let currentState = _.get(store, 'state.layout', {}),
        currentUser = _.get(store, 'state.user'),
        // add unschedule action to the history
        newState = _.assign({}, currentState, {
          scheduled: false,
          scheduleTime: null,
          history: (currentState.history || []).concat([{
            action: 'unschedule',
            timestamp: new Date(),
            users: [currentUser]
          }]
          )});

      return postLayoutList(`${prefix}/_layoutlist`, {
        uri: layoutUri,
        value: newState
      }, store);
    }).then(() => store.dispatch('finishProgress', 'scheduled'));
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
  const prefix = _.get(store, 'state.site.prefix'),
    layoutUri = _.get(store, 'state.page.data.layout');

  return save(replaceVersion(layoutUri, 'published')) // PUT @published with empty data, and it'll clone the latest data
    .then(() => {
      // mimic amphora-search's publish rules, since kiln cannot reliably know when that has run
      let now = new Date(),
        currentState = _.get(store, 'state.layout', {}),
        currentUser = _.get(store, 'state.user'),
        newState;

      if (currentState.scheduled) {
        // unschedule, then publish
        newState = _.assign({}, currentState, {
          scheduled: false,
          scheduleTime: null,
          published: true,
          publishTime: now,
          firstPublishTime: currentState.firstPublishTime || now,
          updateTime: now,
          updateUser: currentUser,
          history: (currentState.history || []).concat([
            { action: 'unschedule', timestamp: now, users: [currentUser] },
            { action: 'publish', timestamp: now, users: [currentUser] }
          ])
        });
      } else {
        newState = _.assign({}, currentState, {
          published: true,
          publishTime: now,
          firstPublishTime: currentState.firstPublishTime || now,
          updateTime: now,
          updateUser: currentUser,
          history: (currentState.history || []).concat([
            { action: 'publish', timestamp: now, users: [currentUser] }
          ])
        });
      }

      return postLayoutList(`${prefix}/_layoutlist`, {
        uri: layoutUri,
        value: newState
      }, store);
    });
}
