import _ from 'lodash';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';

export default {
  [SELECT]: (state, el) => {
    _.set(state, 'ui.currentSelection', el); // note: I'd like to use uri, but what do we do when the same component is on a page twice?
    return state;
  },
  [UN_SELECT]: (state) => {
    _.set(state, 'ui.currentSelection', null);
    return state;
  },
  [FOCUS]: (state, {uri, path}) => {
    _.set(state, 'ui.currentFocus', { uri, path });
    return state;
  },
  [UN_FOCUS]: (state) => {
    _.set(state, 'ui.currentFocus', null);
    return state;
  }
};
