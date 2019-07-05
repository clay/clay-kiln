import _ from 'lodash';
import Vue from 'vue';
import {
  START_PROGRESS,
  FINISH_PROGRESS,
  OPEN_MODAL,
  CLOSE_MODAL,
  OPEN_CONFIRM,
  CLOSE_CONFIRM,
  ADD_ALERT,
  REMOVE_ALERT,
  SHOW_SNACKBAR,
  HIDE_SNACKBAR
} from './mutationTypes';
import { getFieldEl, getComponentEl } from '../utils/component-elements';

/**
 * @module toolbar
 */

/**
 * start progress bar. if already started, this will cause a slight pause
 * before continuing the progress bar
 * @param  {function} commit
 * @param  {string} type e.g. 'save' or 'publish'
 */
export function startProgress({ commit }, type) {
  commit(START_PROGRESS, type);
}

/**
 * finish the progress bar.
 * @param  {function} commit
 * @param  {string} type e.g. 'save' or 'publish'
 */
export function finishProgress({ commit }, type) {
  commit(FINISH_PROGRESS, type);
}

// open and close modals

export function openModal({ commit, dispatch }, config) {
  return dispatch('unfocus').then(() => commit(OPEN_MODAL, config));
}

export function closeModal({ commit, state, dispatch }) {
  const redirectTo = _.get(state, 'ui.currentModal.redirectTo');

  commit(CLOSE_MODAL);

  // if `redirectTo` was configured when opening the modal, re-open a specific form
  // after closing this modal
  if (redirectTo) {
    const uri = redirectTo.uri,
      path = redirectTo.path, // field or group to open the form at
      field = redirectTo.field, // field to focus on after opening the form
      el = getFieldEl(uri, path),
      componentEl = el && getComponentEl(el);

    if (componentEl) {
      // component exists and is in the body (not a head component)
      dispatch('select', componentEl);
    }

    return dispatch('focus', {
      uri, path, initialFocus: field, el
    });
  }
}

// open and close confirmation modals

export function openConfirm({ commit }, config) {
  commit(CLOSE_CONFIRM);
  // wait a tick before showing the new status
  Vue.nextTick(() => {
    commit(OPEN_CONFIRM, config);
  });
}

export function closeConfirm({ commit }) {
  commit(CLOSE_CONFIRM);
}

/**
 * add alert to the array
 * @param {object} store
 * @param {string|object} config the text of the alert (for info), or an object with { type, text }
 */
export function addAlert(store, config) {
  if (_.isString(config)) {
    store.commit(ADD_ALERT, { type: 'info', text: config, permanent: false });
  } else {
    store.commit(ADD_ALERT, _.defaults(config, { type: 'info', permanent: false }));
  }
}

/**
 * remove an alert from the array, specifying the index
 * @param  {object} store
 * @param  {number|object} config index or an equivalent config object
 */
export function removeAlert(store, config) {
  const index = _.isNumber(config) ? config : _.findIndex(_.get(store, 'state.ui.alerts'), alert => _.isEqual(alert, config));

  store.commit(REMOVE_ALERT, index);
}

/**
 * trigger a new snackbar. note: this happens imperatively (toolbar handles the actual creation, by watching this value)
 * note: if you want the snackbar to have an action, pass in both `action` (the text of the button) and `onActionClick` (a reference to the function you want invoked)
 * @param  {object} store
 * @param  {string|object} config message or full config object
 */
export function showSnackbar(store, config) {
  if (_.isString(config)) {
    store.commit(SHOW_SNACKBAR, { message: config, duration: 3000 });
  } else if (config.action) {
    store.commit(SHOW_SNACKBAR, _.assign({}, config, { duration: 5000 })); // give extra time for users to hit the button if they want
  } else {
    store.commit(SHOW_SNACKBAR, _.assign({}, config));
  }
}

export function hideSnackbar(store) {
  store.commit(HIDE_SNACKBAR);
}
