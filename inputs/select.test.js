import Select from './select.vue';

describe('select input', () => {
  const filterBySite = jest.fn(),
    options = {
      propsData: {
        name: 'foo',
        data: null,
        schema: {},
        args: { options: [1, 2, 3] }
      },
      mocks: {
        $store: {
          state: { site: { slug: 'test' } }
        }
      }
    };

  let wrapper;

  filterBySite.mockReturnValue([1, 2, 3]);

  test('Should use default computed keys when no keys are sent in args', () => {
    options.propsData.args.keys = {};
    wrapper = shallowMount(Select, options);

    expect(wrapper.vm.keys).toStrictEqual({
      label: 'name',
      value: 'value'
    });
  });

  test('Should set valueKey to "value" when the label and value value in args.keys are equal', () => {
    options.propsData.args.keys = {
      label: 'text',
      value: 'text'
    };
    wrapper = shallowMount(Select, options);

    expect(wrapper.vm.valueKey).toEqual('value');
  });
});
