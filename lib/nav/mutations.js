import _ from 'lodash';
import { OPEN_NAV, CLOSE_NAV } from './mutationTypes';

export default {
  [OPEN_NAV]: (state, name) => {
    _.set(state, 'ui.currentNav', name);
    return state;
  },
  [CLOSE_NAV]: (state) => {
    _.set(state, 'ui.currentNav', null);
    return state;
  }
};
