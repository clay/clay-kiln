import _ from 'lodash';
import Vue from 'vue';
import { OPEN_DRAWER, CLOSE_DRAWER } from './mutationTypes';

/**
 * @module drawers
 */

export function toggleDrawer(store, name) {
  const currentDrawer = _.get(store, 'state.ui.currentDrawer');

  if (currentDrawer && currentDrawer === name) {
    store.commit(CLOSE_DRAWER);
  } else if (currentDrawer) {
    // close the current drawer, THEN open the new one
    store.commit(CLOSE_DRAWER);
    Vue.nextTick(() => {
      store.commit(OPEN_DRAWER, name);
    });
  } else {
    store.commit(OPEN_DRAWER, name);
  }
}

/**
 * close drawer without toggling a new drawer
 * @param  {Object} store
 */
export function closeDrawer(store) {
  store.commit(CLOSE_DRAWER);
}
