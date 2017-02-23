import Vue from 'vue';
import { SHOW_STATUS, HIDE_STATUS } from './mutationTypes';

export function showStatus({ commit }, status) {
  commit(HIDE_STATUS);
  // wait a tick before showing the new status
  Vue.nextTick(() => {
    commit(SHOW_STATUS, status);
  });
}
