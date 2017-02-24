import _ from 'lodash';
import { SHOW_STATUS, HIDE_STATUS, START_PROGRESS, FINISH_PROGRESS } from './mutationTypes';

export default {
  [SHOW_STATUS]: (state, status) => {
    _.set(state, 'ui.currentStatus', status);
    return state;
  },
  [HIDE_STATUS]: (state) => {
    _.set(state, 'ui.currentStatus', null);
    return state;
  },
  [START_PROGRESS]: (state, type) => {
    type = type || 'save';

    _.set(state, 'ui.progressColor', type);
    _.set(state, 'ui.currentProgress', _.get(state, 'ui.currentProgress') + Math.random() * 10);
    return state;
  },
  [FINISH_PROGRESS]: (state, type) => {
    type = type || 'save';

    _.set(state, 'ui.progressColor', type);
    _.set(state, 'ui.currentProgress', 0);
    return state;
  },
};
