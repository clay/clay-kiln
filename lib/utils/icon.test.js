import lib from './icon.vue';

describe('icon component', () => {
  test('inserts the icon passed in', () => {
    const wrapper = mount(lib);

    expect(wrapper.html()).toContain('kiln-custom-icon');
  });
});
