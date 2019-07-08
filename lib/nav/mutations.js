import _ from 'lodash';
import {
  CHANGE_FAVORITE_PAGE_CATEGORY,
  SHOW_NAV_BACKGROUND,
  HIDE_NAV_BACKGROUND,
  SAVE_USERS
} from './mutationTypes';

export default {
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
  },
  [SAVE_USERS]: (state, users) => {
    _.set(state, 'users', users);
    return state;
  }
};
