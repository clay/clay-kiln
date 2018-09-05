import _ from 'lodash';
import { replaceVersion } from 'clayutils';
import { getMeta, saveMeta } from '../core-data/api';
import updatedStore from '../core-data/store';
import { UPDATE_PAGE_STATE } from './mutationTypes';
import { add as addToQueue } from '../core-data/queue';

/**
 * @module page-state
 */

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
 * run page list updates sequentially, grabbing from the store after each to prevent race conditions
 * @param  {string} prefix
 * @param  {string} uri
 * @param  {object} data
 * @return {Promise}
 */
function sequentialUpdate(prefix, uri, data) {
  let currentState = _.get(updatedStore, 'state.page.state'),
    userToAdd = data.user, // grab this (if it exists), so we can omit it from the data
    updateTime = new Date(),
    users = currentState.users ? _.cloneDeep(currentState.users) : [],
    // always add the update time to the user you're adding to the list.
    // this will allow us to display the list of people who've edited the page, AND the last update timestamp
    // currentUser is usually the current logged-in user, but may be a different person
    // if you're explicitly adding another user to the page.
    // the logic for updating the users list is the same, though
    currentUser = userToAdd ? _.assign({}, userToAdd, { updateTime }) : _.assign({}, _.get(updatedStore, 'state.user'), { updateTime }),
    userIndex = _.findIndex(users, (user) => user.username === currentUser.username),
    // only set the fields we want updated in the new state object as saveMeta is a PATCH request
    newState = _.assign({ updateTime }, data);

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

  newState.history = updateHistoryWithEditAction(currentState, _.omit(currentUser, 'updateTime'));

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
