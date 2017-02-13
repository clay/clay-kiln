import Vue from 'vue';
import lib from './icon.vue';
import icons from './icons';

describe('references', () => {
  function render(Component, propsData) {
    const Ctor = Vue.extend(Component),
      vm = new Ctor({ propsData }).$mount();

    return vm.$el.innerHTML;
  }

  it('inserts the icon passed in', () => {
    expect(render(lib, {
      name: 'draft'
    })).to.equal(icons.draft);
  });
});
