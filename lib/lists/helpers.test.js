import * as lib from './helpers';

describe('list helpers', () => {
  describe('getProp', () => {
    const fn = lib.getProp;

    test('checks whether or not the items in a list has a property', () => {
      const items = [
        { text: 'alpha', count: 2 },
        { text: 'beta', count: 4 },
        { text: 'gamma', count: 1 }];

      expect(fn(items, 'text')).toEqual('text');
      expect(fn(items, 'count')).toEqual('count');
    });

    test(
      'returns null if the items in a list do not have the string property.',
      () => {
        const items = [
            { text: 'alpha' },
            { text: 'beta' },
            { text: 'gamma' }],
          tester = 'title';

        expect(fn(items, tester)).toBeNull();
      }
    );

    test(
      'returns null if the items in a list have the property but it is not a string',
      () => {
        const items = [
            { title: { text: 'alpha' } },
            { title: { text: 'beta' } },
            { title: { text: 'gamma' } }],
          tester = 'title';

        expect(fn(items, tester)).toBeNull();
      }
    );
  });

  describe('getItemIndex', () => {
    const fn = lib.getItemIndex;

    test('get index of an item from a list of text strings', () => {
      const items = [
          'alpha',
          'beta',
          'gamma'],
        tester = 'beta',
        expectedIndex = 1;

      expect(fn(items, tester)).toEqual(expectedIndex);
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

      expect(fn(items, tester)).toEqual(expectedIndex);
    });

    test(
      'get index of an item from a list of objects, by matching one property',
      () => {
        const items = [
            { text: 'alpha' },
            { text: 'beta' },
            { text: 'gamma' }],
          tester = 'gamma',
          expectedIndex = 2;

        expect(fn(items, tester, 'text')).toEqual(expectedIndex);
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

      expect(fn(items, tester)).toEqual(expectedIndex);
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

        fn(items, tester);

        expect(mockLogger).toHaveBeenCalledWith('error', 'The item you are looking for does not have the same data structure as the items in the list.', { action: 'modifyList' });
      }
    );

    test(
      'throws an error when trying to find the index of an item that has a different object structure than the items in the list',
      () => {
        const items = [
            { text: 'George Washington' },
            { text: 'John Adams' },
            { text: 'Thomas Jefferson' },
            { text: 'James Madison' }
          ],
          tester = {
            name: 'Thomas Jefferson'
          };

        lib.getItemIndex(items, tester);

        expect(mockLogger).toHaveBeenCalledWith('error', 'The item you are looking for does not have the same object structure as the items in the list.', { action: 'modifyList' });
      }
    );
  });

  describe('sortPages', () => {
    const fn = lib.sortPages;

    test('places uncategorized pages into a General category', () => {
      expect(fn()).toEqual([{
        id: 'general',
        title: 'General',
        children: []
      }]);

      expect(fn([])).toEqual([{
        id: 'general',
        title: 'General',
        children: []
      }]);

      expect(fn([{ id: 'something', title: 'Something' }])).toEqual([{
        id: 'general',
        title: 'General',
        children: [{ id: 'something', title: 'Something' }]
      }]);

      // and sorts them!
      expect(fn([{
        id: 'b',
        title: 'B'
      }, {
        id: 'a',
        title: 'A'
      }])).toEqual([{
        id: 'general',
        title: 'General',
        children: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]
      }]);
    });

    test('sorts categories', () => {
      expect(fn([{
        id: 'b',
        title: 'B',
        children: []
      }, {
        id: 'a',
        title: 'A',
        children: []
      }])).toEqual([{
        id: 'a',
        title: 'A',
        children: []
      }, {
        id: 'b',
        title: 'B',
        children: []
      }]);
    });

    test('sorts pages inside each category', () => {
      expect(fn([{
        id: 'a',
        title: 'A',
        children: [{ id: 'b', title: 'B' }, { id: 'a', title: 'A' }]
      }])).toEqual([{
        id: 'a',
        title: 'A',
        children: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]
      }]);
    });
  });
});
