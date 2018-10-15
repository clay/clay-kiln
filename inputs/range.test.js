import _ from 'lodash';
import Range from './range.vue';

describe('range input', () => {
  test('renders with no props', () => {
    const wrapper = shallowMount(Range, {
      propsData: {
        name: 'foo',
        data: null,
        schema: {},
        args: {}
      },
      mocks: {
        $store: {
          commit: _.noop
        }
      }
    });

    expect(wrapper.html()).toContain('<div class="editor-range');
  });
});
