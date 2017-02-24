import { assign, set } from 'lodash';
import { OPEN_PANE, CLOSE_PANE, CHANGE_PANE } from './mutationTypes';

export default {
  [OPEN_PANE]: (state, paneState) => {
    assign(state.ui, { currentPane: paneState });
    return state;
  },
  [CLOSE_PANE]: (state, paneState) => {
    assign(state.ui, { currentPane: paneState });
    return state;
  },
  [CHANGE_PANE]: (state) => {
    assign(state.ui, {currentPane: 'transitioning'});
    return state;
  }
};
