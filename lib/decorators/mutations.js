import _ from 'lodash';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';

export default {
  [SELECT]: (state, { uri, el, parentField, parentURI }) => {
    _.set(state, 'ui.currentSelection', { uri, el, parentField, parentURI });
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
