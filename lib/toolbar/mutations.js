import _ from 'lodash';
import { SHOW_STATUS, HIDE_STATUS } from './mutationTypes';

export default {
  [SHOW_STATUS]: (state, status) => {
    _.set(state, 'ui.currentStatus', status);
    return state;
  },
  [HIDE_STATUS]: (state) => {
    _.set(state, 'ui.currentStatus', null);
    return state;
  }
};
