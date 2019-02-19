import _ from 'lodash';
import { OPEN_NAV, CLOSE_NAV, CHANGE_FAVORITE_PAGE_CATEGORY, SHOW_NAV_BACKGROUND, HIDE_NAV_BACKGROUND } from './mutationTypes';

export default {
  [OPEN_NAV]: (state, { name, config }) => {
    _.set(state, 'ui.currentNav', name);
    if (config) {
      _.set(state, 'ui.currentNavConfig', config);
    }
    return state;
  },
  [CLOSE_NAV]: (state) => {
    _.set(state, 'ui.currentNav', null);
    _.set(state, 'ui.currentNavConfig', null);
    return state;
  },
  [CHANGE_FAVORITE_PAGE_CATEGORY]: (state, id) => {
    _.set(state, 'ui.favoritePageCategory', id);
    return state;
  },
  [SHOW_NAV_BACKGROUND]: (state) => {
    _.set(state, 'ui.showNavBackground', true);
    return state;
  },
  [HIDE_NAV_BACKGROUND]: (state) => {
    _.set(state, 'ui.showNavBackground', false);
    return state;
  }
};
