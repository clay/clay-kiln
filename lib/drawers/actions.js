console.log('go drawer4');
import _ from 'lodash';
import Vue from 'vue';
import { OPEN_DRAWER, CLOSE_DRAWER } from './mutationTypes';

/**
 * @module drawers
 */

export function toggleDrawer(store, name) {
  const currentDrawer = _.get(store, 'state.ui.currentDrawer');
  let promise;

  if (currentDrawer && currentDrawer === name) {
    return store.commit(CLOSE_DRAWER);
  }
  promise = name === 'publish' || name === 'health' ?
    store.dispatch('validate') :
    Promise.resolve();

  if (currentDrawer) {
    // close the current drawer, THEN open the new one
    return promise.then(() => {
      store.commit(CLOSE_DRAWER);
      Vue.nextTick(() => {
        store.commit(OPEN_DRAWER, name);
      });
    })
  }
  return promise.then(() => store.commit(OPEN_DRAWER, name))
}

/**
 * close drawer without toggling a new drawer
 * @param  {Object} store
 */
export function closeDrawer(store) {
  store.commit(CLOSE_DRAWER);
}
