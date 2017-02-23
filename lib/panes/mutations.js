import { assign, set } from 'lodash';
import { OPEN_PANE, CLOSE_PANE } from './mutationTypes';

export default {
  [OPEN_PANE]: (state, paneState) => {
    assign(state.ui, { currentPane: paneState });
    return state;
  },
  [CLOSE_PANE]: (state, paneState) => {
    assign(state.ui, { currentPane: paneState });
    return state;
  }
};
