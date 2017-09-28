import _ from 'lodash';
import Vue from 'vue';
import Vuex from 'vuex';
import { beforeEachHooks, afterEachHooks, mount } from 'vue-unit/src';

const testsContext = require.context('../', true, /^\.\/(lib|behaviors|inputs)\/.*?\.test\.js$/);

let defaultStore;

// allow store mocking
Vue.use(Vuex);
defaultStore = new Vuex.Store({ state: {} });

// add renderWithArgs function to all tests, allowing us to easily test vue components
window.renderWithArgs = (Component, props, state) => {
  return mount(Component, { props, store: _.assign({}, defaultStore, { state }) });
};

window.beforeEachHooks = beforeEachHooks;
window.afterEachHooks = afterEachHooks;

// don't write to console
sinon.stub(console);

// run all tests
testsContext.keys().forEach(testsContext);
