import _ from 'lodash';
import { OPEN_NAV, CLOSE_NAV } from './mutationTypes';

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
  }
};
