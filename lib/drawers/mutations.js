import _ from 'lodash';
import { OPEN_DRAWER, CLOSE_DRAWER } from './mutationTypes';

export default {
  [OPEN_DRAWER]: (state, name) => {
    _.set(state, 'ui.currentDrawer', name);

    return state;
  },
  [CLOSE_DRAWER]: (state) => {
    _.set(state, 'ui.currentDrawer', null);

    return state;
  }
};
