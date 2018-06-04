import * as helpers from './helpers';

describe('list helpers', () => {
  test('get index of an item from a list of text strings', () => {
    const items = [
        'alpha',
        'beta',
        'gamma'],
      tester = 'beta',
      expectedIndex = 1;

    expect(helpers.getItemIndex(items,tester)).toEqual(expectedIndex);
  });

  test('get index of an item from a list of strings', () => {
    const items = [
        'George Washington',
        'John Adams',
        'Thomas Jefferson',
        'James Madison'
      ],
      tester = 'Thomas Jefferson',
      expectedIndex = 2;

    expect(helpers.getItemIndex(items, tester)).toEqual(expectedIndex);
  });

  test(
    'get index of an item from a list of objects, by matching one property',
    () => {
      const items = [
          { text : 'alpha' },
          { text : 'beta' },
          { text : 'gamma'}],
        tester = 'gamma',
        expectedIndex = 2;

      expect(helpers.getItemIndex(items, tester, 'text')).toEqual(expectedIndex);
    }
  );

  test('get index of an item from a list of objects', () => {
    const items = [
        {
          id: 'new',
          title: 'Article'
        },
        {
          id: 'new-feature-lede',
          title: 'Feature Article'
        },
        {
          id: 'new-sponsored',
          title: 'Sponsored Article'
        }],
      tester = {
        id: 'new-feature-lede',
        title: 'Feature Article'
      },
      expectedIndex = 1;

    expect(helpers.getItemIndex(items,tester)).toEqual(expectedIndex);
  });

  test(
    'throws an error when trying to find the index of an item that has a different data structure than the items in the list',
    () => {
      const items = [
          'George Washington',
          'John Adams',
          'Thomas Jefferson',
          'James Madison'
        ],
        tester = {
          name: 'Thomas Jefferson'
        };

      helpers.getItemIndex(items, tester);

      expect(mockLogger).toHaveBeenCalledWith('error', 'The item you are looking for does not have the same data structure as the items in the list.', {action: 'modifyList'});
    }
  );

  test(
    'throws an error when trying to find the index of an item that has a different object structure than the items in the list',
    () => {
      const items = [
          {text: 'George Washington'},
          {text: 'John Adams'},
          {text: 'Thomas Jefferson'},
          {text: 'James Madison'}
        ],
        tester = {
          name: 'Thomas Jefferson'
        };

      helpers.getItemIndex(items, tester);

      expect(mockLogger).toHaveBeenCalledWith('error', 'The item you are looking for does not have the same object structure as the items in the list.', {action: 'modifyList'});
    }
  );

  test('remove an item from a list', () => {
    const items = [
        { text : 'alpha' },
        { text : 'beta' },
        { text : 'gamma'}],
      tester = 'gamma',
      updatedItems = helpers.removeListItem(items, tester, 'text');

    expect(helpers.getItemIndex(updatedItems, tester, 'text')).toEqual(-1);
  });

  test(
    'throw an error if trying to remove a non-existent item from a list',
    () => {
      const items = [
          { text : 'alpha' },
          { text : 'beta' },
          { text : 'gamma'}],
        tester = 'theta';

      helpers.removeListItem(items, tester, 'text');
      expect(mockLogger).toHaveBeenCalledWith('error', 'Cannot remove theta because it is not in the list.', { action: 'modifyList' });
    }
  );

  test('add an item to a list of strings', () => {
    const items = [
        'alpha',
        'beta',
        'gamma'
      ],
      tester = 'theta',
      updatedItems = helpers.addListItem(items, tester);

    expect(updatedItems.length).toEqual(4);
    expect(updatedItems.indexOf(tester)).toEqual(3);
  });

  test('add an item to a list of objects', () => {
    const items = [
        { text : 'alpha' },
        { text : 'beta' },
        { text : 'gamma'}],
      tester = { text: 'theta' },
      updatedItems = helpers.addListItem(items, tester);

    expect(updatedItems.length).toEqual(4);
    expect(updatedItems.indexOf(tester)).toEqual(3);
  });

  test(
    'throw an error if trying to add an already existing item to a list',
    () => {
      const items = [
          { text : 'alpha' },
          { text : 'beta' },
          { text : 'gamma'}],
        tester = { text: 'alpha' },
        updatedItems = helpers.addListItem(items, tester);

      expect(updatedItems).toEqual(items);
      expect(mockLogger).toHaveBeenCalledWith('info', 'This item already exists in this list.', {action: 'modifyList'});
    }
  );

  test('checks whether or not the items in a list has a property', () => {
    const items = [
      { text : 'alpha', count: 2 },
      { text : 'beta', count: 4 },
      { text : 'gamma', count: 1}];

    expect(helpers.getProp(items, 'text')).toEqual('text');
    expect(helpers.getProp(items, 'count')).toEqual('count');
  });

  test(
    'returns null if the items in a list do not have the string property.',
    () => {
      const items = [
          { text : 'alpha' },
          { text : 'beta' },
          { text : 'gamma'}],
        tester = 'title';

      expect(helpers.getProp(items, tester)).toBeNull();
    }
  );

  test(
    'returns null if the items in a list have the property but it is not a string',
    () => {
      const items = [
          { title : {text: 'alpha'} },
          { title: {text: 'beta'} },
          { title : {text: 'gamma'}}],
        tester = 'title';

      expect(helpers.getProp(items, tester)).toBeNull();
    }
  );
});
