import _ from 'lodash';
import Vue from 'vue';
import Vuex from 'vuex';
import { beforeEachHooks, afterEachHooks, mount } from 'vue-unit/src';
import * as logger from '../lib/utils/log'; // allow us to stub the default

const testsContext = require.context('../', true, /^\.\/(lib|inputs)\/.*?\.test\.js$/);

let defaultStore;

// allow store mocking
Vue.use(Vuex);
defaultStore = new Vuex.Store({ state: {} });

// add renderWithArgs function to all tests, allowing us to easily test vue components
window.renderWithArgs = (Component, props, state) => {
  return mount(Component, { props, store: _.assign({}, defaultStore, { state }) });
};

// stub logger
window.loggerStub = {
  info: sinon.spy(),
  trace: sinon.spy(),
  debug: sinon.spy(),
  warn: sinon.spy(),
  error: sinon.spy()
};

sinon.stub(logger, 'default', () => {
  // return the same instances of our logging spies every time
  // we create a new logger
  return window.loggerStub;
});

window.beforeEachHooks = beforeEachHooks;
window.afterEachHooks = afterEachHooks;

// run all tests
testsContext.keys().forEach(testsContext);
