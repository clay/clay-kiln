import { SHOW_NAV_BACKGROUND, HIDE_NAV_BACKGROUND } from './mutationTypes';
import { OPEN_DRAWER, CLOSE_DRAWER } from '../nav/mutationTypes';

/**
 * @module nav
 */

/**
 * open nav tab
 * @param  {object} store
 * @param  {string|object} nameOrConfig tab name, or clay menu config
 * openNav sets the ui.currentDrawer vuex variable, this allows drawers (the right slide-in menus)
 * as well as the "nav" (the left slide-in menu) to be deep linked to
 */
export function openNav(store, nameOrConfig) {
  store.commit(OPEN_DRAWER, nameOrConfig);
}

export function closeNav(store) {
  store.commit(CLOSE_DRAWER);
  store.dispatch('clearHash'); // Update page url hash
}

export function hideNavBackground(store) {
  store.commit(HIDE_NAV_BACKGROUND);
}

export function showNavBackground(store) {
  store.commit(SHOW_NAV_BACKGROUND);
}
