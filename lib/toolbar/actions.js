import _ from 'lodash';
import Vue from 'vue';
import { SHOW_STATUS, HIDE_STATUS, START_PROGRESS, FINISH_PROGRESS, OPEN_MODAL, CLOSE_MODAL } from './mutationTypes';

export function showStatus({ commit }, status) {
  commit(HIDE_STATUS);
  // wait a tick before showing the new status
  Vue.nextTick(() => {
    commit(SHOW_STATUS, status);
  });
}

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

export function openModal({ commit, dispatch }, config) {
  return dispatch('unfocus').then(() => commit(OPEN_MODAL, config));
}

export function closeModal({ commit }) {
  commit(CLOSE_MODAL);
}
