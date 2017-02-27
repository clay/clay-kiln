import _ from 'lodash';
import { OPEN_PANE, CLOSE_PANE, CHANGE_PANE } from './mutationTypes';

export default {
  [OPEN_PANE]: (state, options) => {
    _.set(state, 'ui.currentPane', options);
    return state;
  },
  [CLOSE_PANE]: (state) => {
    _.set(state, 'ui.currentPane', null);
    return state;
  },
  [CHANGE_PANE]: (state) => {
    // set a special state (an object with `transitioning: true`)
    // so the overlay doesn't flicker when switching directly from
    // one pane to another
    _.set(state, 'ui.currentPane', { transitioning: true });
    return state;
  }
};
