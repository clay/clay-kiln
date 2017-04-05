import Vue from 'vue';
import Vuex from 'vuex';
import AsyncComputed from 'vue-async-computed';
import defaultState from '../preloader/default-state';
import mutations from './mutations';
import actions from './actions';
import plugins from './plugins';
import lists from '../lists';

Vue.use(Vuex);
Vue.use(AsyncComputed);

const store = new Vuex.Store({
  strict: true, // todo: this is only for dev. remove it before releasing to production
  state: defaultState,
  mutations: mutations,
  actions: actions,
  plugins: plugins,
  modules: {
    lists
  }
});

export default store;
