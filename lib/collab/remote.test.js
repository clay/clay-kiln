import _ from 'lodash';
import {
  removedChildren, cssEscape, changedLayoutLists, composeLayoutLists, renderableLayoutLists
} from './remote';

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
  describe('layout lists', () => {
    const schema = {
        top: { _componentList: true },
        main: { _componentList: { page: true } },
        kilnInternals: { _componentList: true },
        title: { _has: 'text' }
      },
      layoutStore = {
        state: {
          layout: {
            schema,
            // kiln keeps layout lists composed with their children's data
            data: { top: [_.assign({ title: 'A' }, a), _.assign({ title: 'B' }, b)], main: 'main', kilnInternals: [c] }
          },
          components: { [a._ref]: { title: 'A' }, [b._ref]: { title: 'B' } }
        }
      };

    test('only lists whose refs changed count, not page areas or other fields', () => {
      expect(changedLayoutLists(layoutStore, {
        top: [a, b], main: 'main', kilnInternals: [c], _version: 2, title: 'x'
      })).toEqual([]);
      expect(changedLayoutLists(layoutStore, { top: [b, a], main: 'main', kilnInternals: [c] })).toEqual(['top']);
    });

    test('changed lists keep kiln\'s composed shape', () => {
      const data = composeLayoutLists(layoutStore, { top: [b, a] }, ['top']);

      expect(data.top).toEqual([{ _ref: b._ref, title: 'B' }, { _ref: a._ref, title: 'A' }]);
      expect(data.main).toBe('main');
      expect(data.kilnInternals).toEqual([c]);
    });

    test('never re-renders the list holding kiln, or lists the page doesn\'t have', () => {
      const html = document.implementation.createHTMLDocument('');

      document.body.innerHTML = '<div data-editable="top"></div><div data-editable="kilnInternals"><div class="kiln-wrapper"></div></div>';
      html.body.innerHTML = '<div data-editable="top"></div><div data-editable="kilnInternals"></div>';
      document.head.innerHTML = '<!-- data-editable="headLayout" --><meta name="a"><!-- data-editable-end -->';
      html.head.innerHTML = '<!-- data-editable="headLayout" --><meta name="b"><!-- data-editable-end -->';

      expect(renderableLayoutLists(['top', 'kilnInternals', 'headLayout', 'missing'], html)).toEqual(['top', 'headLayout']);
      document.body.innerHTML = '';
      document.head.innerHTML = '';
    });
  });
});
