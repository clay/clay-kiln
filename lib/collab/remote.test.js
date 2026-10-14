import { removedChildren, cssEscape } from './remote';

jest.mock('../core-data/api');
jest.mock('../component-data/model');
jest.mock('../component-data/create', () => ({ resolveSchema: () => Promise.resolve() }));
jest.mock('../core-data/store', () => ({ state: { components: {} }, commit: jest.fn(), dispatch: jest.fn() }));

const a = { _ref: 'site/_components/p/instances/a' },
  b = { _ref: 'site/_components/p/instances/b' },
  c = { _ref: 'site/_components/p/instances/c' };

describe('collab remote', () => {
  describe('removedChildren', () => {
    test('lists components taken out of lists, with where they were', () => {
      expect(removedChildren({ content: [a, b, c], title: 'x' }, { content: [a, c], title: 'y' })).toEqual([{ path: 'content', uri: b._ref, index: 1 }]);
    });

    test('ignores lists that aren\'t component lists', () => {
      expect(removedChildren({ tags: [{ text: 'x' }] }, { tags: [] })).toEqual([]);
    });

    test('handles a list that went away', () => {
      expect(removedChildren({ content: [a] }, {})).toEqual([{ path: 'content', uri: a._ref, index: 0 }]);
    });
  });

  describe('cssEscape', () => {
    test('makes uris from other editors safe in selectors', () => {
      const uri = 'site/_components/p/instances/x"] , *[data-x="';

      expect(() => document.querySelector(`[data-uri="${cssEscape(uri)}"]`)).not.toThrow();
    });
  });
});
