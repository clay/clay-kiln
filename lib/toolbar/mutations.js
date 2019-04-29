import _ from 'lodash';
import {
  START_PROGRESS,
  FINISH_PROGRESS,
  OPEN_MODAL,
  CLOSE_MODAL,
  OPEN_CONFIRM,
  CLOSE_CONFIRM,
  ADD_ALERT,
  REMOVE_ALERT,
  SHOW_SNACKBAR,
  HIDE_SNACKBAR,
  TOGGLE_EDIT_MODE
} from './mutationTypes';

export default {
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
  },
  [OPEN_CONFIRM]: (state, config) => {
    _.set(state, 'ui.currentConfirm', config);
    return state;
  },
  [CLOSE_CONFIRM]: (state) => {
    _.set(state, 'ui.currentConfirm', null);
    return state;
  },
  [ADD_ALERT]: (state, config) => {
    state.ui.alerts.push(config);
    return state;
  },
  [REMOVE_ALERT]: (state, index) => {
    state.ui.alerts.splice(index, 1);
    return state;
  },
  [SHOW_SNACKBAR]: (state, config) => {
    _.set(state, 'ui.snackbar', config);
    return state;
  },
  [HIDE_SNACKBAR]: (state) => {
    _.set(state, 'ui.snackbar', {});
    return state;
  },
  [TOGGLE_EDIT_MODE]: (state, mode) => {
    _.set(state, 'editMode', mode); // mode is 'page' or 'layout'
    return state;
  }
};
