import _ from 'lodash';
import { SHOW_STATUS, HIDE_STATUS, START_PROGRESS, FINISH_PROGRESS, OPEN_MODAL, CLOSE_MODAL } from './mutationTypes';

export default {
  [SHOW_STATUS]: (state, status) => {
    _.set(state, 'ui.currentStatus', status);
    return state;
  },
  [HIDE_STATUS]: (state) => {
    _.set(state, 'ui.currentStatus', null);
    return state;
  },
  [START_PROGRESS]: (state) => {
    _.set(state, 'ui.currentProgress', _.get(state, 'ui.currentProgress') + Math.random() * 10);
    return state;
  },
  [FINISH_PROGRESS]: (state) => {
    _.set(state, 'ui.currentProgress', 0);
    return state;
  },
  [OPEN_MODAL]: (state, config) => {
    _.set(state, 'ui.currentModal', config);
    return state;
  },
  [CLOSE_MODAL]: (state) => {
    _.set(state, 'ui.currentModal', null);
    return state;
  }
};
