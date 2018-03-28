import _ from 'lodash';
import Vue from 'vue';
import { OPEN_DRAWER, CLOSE_DRAWER } from './mutationTypes';

/**
 * @module drawers
 */

export function toggleDrawer(store, name) {
  const currentDrawer = _.get(store, 'state.ui.currentDrawer');

  if (currentDrawer && currentDrawer === name) {
    return store.commit(CLOSE_DRAWER);
  }
  else if (currentDrawer) {
    // close the current drawer, THEN open the new one
    store.commit(CLOSE_DRAWER);
    return new Promise((resolve, reject) => {
      Vue.nextTick(() => {
        store.commit(OPEN_DRAWER, name);
        store.dispatch('validate', resolve);
      });
    })
  } else {
    store.commit(OPEN_DRAWER, name);
    return store.dispatch('validate');
  }
}

/**
 * close drawer without toggling a new drawer
 * @param  {Object} store
 */
export function closeDrawer(store) {
  store.commit(CLOSE_DRAWER);
}
