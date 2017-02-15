import Vue from 'vue';
import lib from './label.vue';

describe('references', () => {
  function render(Component, propsData) {
    const Ctor = Vue.extend(Component),
      vm = new Ctor({ propsData }).$mount();

    return vm.$el;
  }

  it('adds label', () => {
    expect(render(lib, {
      name: 'test'
    }).innerText).to.equal('Test');
  });
});
