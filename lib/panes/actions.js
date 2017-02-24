import Vue from 'vue';
import { OPEN_PANE, CHANGE_PANE } from './mutationTypes';

export function changePane({ commit }, paneConfig) {
  commit(CHANGE_PANE);
  // wait a tick before showing the new status
  Vue.nextTick(() => {
    commit(OPEN_PANE, paneConfig);
  });
}
