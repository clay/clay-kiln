import Vue from 'vue';
import Vuex from 'vuex';
import defaultState from '../preloader/default-state';
import mutations from './mutations';
import actions from './actions';

Vue.use(Vuex);

const store = new Vuex.Store({
  strict: true, // todo: this is only for dev. remove it before releasing to production
  state: defaultState,
  mutations: mutations,
  actions: actions
});

export default store;
