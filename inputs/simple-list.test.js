import SimpleList from './simple-list.vue';

describe('simple list input', () => {
  const options = {
      propsData: {
        name: 'foo',
        data: null,
        schema: {},
        args: {}
      }
    },
    items = [
      { text: 'test1', count: 1 },
      { text: 'test2', count: 2 }
    ];

  let wrapper;

  test('Should decrease count when there is a removedItem', () => {
    wrapper = shallowMount(SimpleList, options);
    wrapper.vm.removedItem = { text: 'test2' };

    expect(wrapper.vm.handleRemoveItem(items)).toStrictEqual([
      { text: 'test1', count: 1 },
      { text: 'test2', count: 1 }
    ]);
  });

  test("Should return same array if removedItem doesn't exist", () => {
    wrapper = shallowMount(SimpleList, options);
    wrapper.vm.removedItem = { text: 'something else' };

    expect(wrapper.vm.handleRemoveItem(items)).toStrictEqual(items);
  });

  test('Should return same array if removedItem is null', () => {
    wrapper = shallowMount(SimpleList, options);
    wrapper.vm.removedItem = null;

    expect(wrapper.vm.handleRemoveItem(items)).toStrictEqual(items);
  });
});
