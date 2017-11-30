import Vue from 'vue';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';

export default {
  [SELECT]: (state, { uri, el, parentField, parentURI }) => {
    Vue.set(state, 'ui.currentSelection', { uri, el, parentField, parentURI });
    return state;
  },
  [UN_SELECT]: (state) => {
    Vue.set(state, 'ui.currentSelection', null);
    return state;
  },
  [FOCUS]: (state, {uri, path}) => {
    Vue.set(state, 'ui.currentFocus', { uri, path });
    return state;
  },
  [UN_FOCUS]: (state) => {
    Vue.set(state, 'ui.currentFocus', null);
    return state;
  }
};
