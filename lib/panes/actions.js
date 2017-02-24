import Vue from 'vue';
import { OPEN_PANE, CHANGE_PANE } from './mutationTypes';

export function changePane({ commit }, paneConfig) {
  commit(CHANGE_PANE);
  // wait a tick before showing the new status
  Vue.nextTick(() => {
    commit(OPEN_PANE, paneConfig);
  });
}

export function openPane({ dispatch, commit }, paneConfig) {
  return dispatch('closeForm')
    .then(() => {
      commit(OPEN_PANE, paneConfig);
    });
}
