import Vue from 'vue';
import Vuex from 'vuex';
import AsyncComputed from 'vue-async-computed';
import defaultState from '../preloader/default-state';
import mutations from './mutations';
import actions from './actions';
import reactiveRender from '../component-data/reactive-render';
import pubsub from '../component-data/pubsub';

Vue.use(Vuex);
Vue.use(AsyncComputed);

const store = new Vuex.Store({
  strict: true, // todo: this is only for dev. remove it before releasing to production
  state: defaultState,
  mutations: mutations,
  actions: actions,
  plugins: [reactiveRender, pubsub]
});

export default store;
