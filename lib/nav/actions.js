import _ from 'lodash';
import { OPEN_NAV, CLOSE_NAV } from './mutationTypes';

/**
 * @module nav
 */

export function openNav(store, name) {
  const currentNav = _.get(store, 'state.ui.currentNav');

  if (currentNav !== name) {
    store.commit(OPEN_NAV, name);
  }
}

export function closeNav(store) {
  store.commit(CLOSE_NAV);
}
