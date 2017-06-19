import Vue from 'vue';
import Vuex from 'vuex';
import AsyncComputed from 'vue-async-computed';
import defaultState from '../preloader/default-state';
import mutations from './mutations';
import actions from './actions';
import plugins from './plugins';

Vue.use(Vuex);
Vue.use(AsyncComputed);

const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production', // only do strict mode when developing
  state: defaultState,
  mutations: mutations,
  actions: actions,
  plugins: plugins
});

export default store;
