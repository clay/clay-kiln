import Vue from 'vue';

const testsContext = require.context('../', true, /^\.\/(lib|behaviors)\/.*?\.test\.js$/);

// add renderWithArgs function to all tests, allowing us to easily test vue components
window.renderWithArgs = (Component, propsData) => {
  const Ctor = Vue.extend(Component);

  return new Ctor({ propsData }).$mount();
};

// don't write to console
sinon.stub(console);

// run all tests
testsContext.keys().forEach(testsContext);
