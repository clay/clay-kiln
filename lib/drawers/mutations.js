import _ from 'lodash';
import { OPEN_DRAWER, CLOSE_DRAWER } from './mutationTypes';

export default {
  [OPEN_DRAWER]: (state, config) => {
    _.set(state, 'ui.currentDrawer', config);
    return state;
  },
  [CLOSE_DRAWER]: (state) => {
    _.set(state, 'ui.currentDrawer', null);
    return state;
  }
};
