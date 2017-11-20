import _ from 'lodash';
import { OPEN_NAV, CLOSE_NAV } from './mutationTypes';

/**
 * @module nav
 */

/**
 * open nav tab
 * @param  {object} store
 * @param  {string|object} nameOrConfig tab name, or clay menu config
 */
export function openNav(store, nameOrConfig) {
  const currentNav = _.get(store, 'state.ui.currentNav'),
    name = _.isString(nameOrConfig) ? nameOrConfig : nameOrConfig.tab,
    config = _.isObject(nameOrConfig) ? nameOrConfig : null;

  if (currentNav !== name) {
    store.commit(OPEN_NAV, { name, config });
  }
}

export function closeNav(store) {
  store.commit(CLOSE_NAV);
  store.dispatch('clearHash'); // Update page url hash
}
