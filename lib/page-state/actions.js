import _ from 'lodash';
import { postJSON } from '../core-data/api';
import { UPDATE_PAGE_STATE } from './mutationTypes';
import { searchRoute, replaceVersion } from '../utils/references';

/**
 * @module page-state
 */

const postPageList = _.debounce((endpoint, data, store) => {
  return postJSON(endpoint, data).then((response) => {
    store.commit(UPDATE_PAGE_STATE, response.value);
  });
}, 500); // only update the page list every 500ms

/**
 * updates the state's history array to make sure the latest item is an
 * 'edit' event that includes the current user
 * note: this function is only exported for testing purposes, and should not be used by other modules
 * @param  {object} state
 * @param  {object} currentUser
 * @return {object}
 */
export function updateHistoryWithEditAction(state, currentUser) {
  let history = state.history ? _.cloneDeep(state.history) : [];

  // If history is empty or the latest item is not an edit event, add a new edit event
  if (history.length === 0 || history[history.length - 1].action !== 'edit') {
    history.push({
      action: 'edit',
      timestamp: new Date(),
      users: [_.omit(currentUser, ['updateTime'])]
    });
  // latest item is an edit event, and but it doesn't contain this user, add the user to the event
  } else if (_.find(history[history.length - 1].users, (user) => user.username === currentUser.username) === undefined) {
    history[history.length - 1].users.push(currentUser);
  }

  return history;
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

  let fullCurrentState = _.get(store, 'state.page.state'),
    userToAdd = data.user, // grab this (if it exists), so we can omit it from the data
    currentState = _.omit(fullCurrentState, ['published', 'scheduled', 'publishTime', 'scheduledTime']),
    // never try to save these to the page list, since amphora-search will handle them server-side
    updateTime = new Date(),
    users = currentState.users ? _.cloneDeep(currentState.users) : [],
    // always add the update time to the user you're adding to the list.
    // this will allow us to display the list of people who've edited the page, AND the last update timestamp
    // currentUser is usually the current logged-in user, but may be a different person
    // if you're explicitly adding another user to the page.
    // the logic for updating the users list is the same, though
    currentUser = userToAdd ? _.assign({}, userToAdd, { updateTime }) : _.assign({}, _.get(store, 'state.user'), { updateTime }),
    userIndex = _.findIndex(users, (user) => user.username === currentUser.username),
    newState = _.assign({}, currentState, _.omit(data, ['user']), { updateTime });

  if (userIndex === -1) {
    users.push(currentUser);
  } else if (userIndex > -1) {
    // if the current user is in the list, but isn't at the end, we should move it to the end
    // (if it's already at the end, we just want to update the updateTime for the user)
    users.splice(userIndex, 1); // remove user from list
    users.push(currentUser); // and add it to the end
  }

  // then add the new (cloned and updated) users array to the new state
  newState.users = users;

  newState.history = updateHistoryWithEditAction(newState, currentUser);

  return postPageList(`${prefix}/_pagelist`, {
    url: uri,
    value: newState
  }, store);
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
  const sitePrefix = prefix || _.get(store, 'state.site.prefix');

  let query = {
    index: 'pages',
    type: 'general',
    body: {
      size: 1,
      query: {
        term: {
          uri: replaceVersion(uri) // match page uri (removing @published or @scheduled)
        }
      }
    }
  };

  return postJSON(sitePrefix + searchRoute, query)
    .then((res) => _.get(res, 'hits.hits[0]._source'))
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
