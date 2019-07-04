import _ from 'lodash';
import { OPEN_DRAWER, CLOSE_DRAWER } from './mutationTypes';

/**
 * @module drawers
 */

export function toggleDrawer(store, nameOrConfig) {
  const currentDrawer = _.get(store, 'state.ui.currentDrawer'),
    name = _.isString(nameOrConfig) ? nameOrConfig : nameOrConfig.tab;

  if (currentDrawer && currentDrawer === name) {
    store.dispatch('closeDrawer');
  } else {
    store.dispatch('openDrawer', nameOrConfig);
  }
}

/**
 * close drawer without toggling a new drawer
 * @param  {Object} store
 */
export function closeDrawer(store) {
  store.dispatch('clearHash');
  store.dispatch('hideNavBackground');
  store.commit(CLOSE_DRAWER);
}

/**
 * open drawer
 * @param  {Object} store
 * @param  {(string|object)} nameOrConfig - either just the tab name or a json object for deeper linking
 */
export function openDrawer(store, nameOrConfig) {
  const name = _.isString(nameOrConfig) ? nameOrConfig : nameOrConfig.tab,
    currentURLState = store.state.url;

  let config = null;

  if (_.isObject(nameOrConfig)) {
    config = nameOrConfig;
  } else if (currentURLState && name === currentURLState.tab) {
    config = { tab: name, ...currentURLState };
  } else {
    config = {
      tab: name, sites: '', status: '', query: ''
    };
  }

  store.dispatch('setHash', { menu: config });
  store.commit(OPEN_DRAWER, name);
}
