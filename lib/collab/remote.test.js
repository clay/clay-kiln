import _ from 'lodash';
import {
  removedChildren, cssEscape, changedLayoutLists, composeLayoutLists, renderableLayoutLists, catchUp
} from './remote';
import ctx, { getRev, setRev, distrust } from './context';
import { getWithRevision, getMeta } from '../core-data/api';
import { render as modelRender } from '../component-data/model';
import { UPDATE_COMPONENT } from '../component-data/mutationTypes';
import { COLLAB_PENDING } from './mutationTypes';

jest.mock('../core-data/api');
jest.mock('../component-data/model');
jest.mock('../component-data/create', () => ({ resolveSchema: () => Promise.resolve() }));
jest.mock('../core-data/store', () => ({ state: { components: {} }, commit: jest.fn(), dispatch: jest.fn() }));
jest.mock('../undo/actions', () => ({ rebaseHistory: jest.fn() }));

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

  describe('catchUp', () => {
    const page = 'site/_pages/p',
      same = 'site/_components/text/instances/same',
      changed = 'site/_components/text/instances/changed',
      broken = 'site/_components/text/instances/broken';
    let server,
      store;

    /**
     * What the server has, by uri: { data, rev }, or an Error.
     * @param {object} items
     */
    function serve(items) {
      server = items;
      getWithRevision.mockImplementation((url) => {
        const item = server[url.replace('?hooks=false', '')];

        return item instanceof Error ? Promise.reject(item) : Promise.resolve(_.cloneDeep(item));
      });
    }

    beforeEach(() => {
      _.assign(ctx, {
        session: 'session1', page, layout: null, revs: {}, successors: {}, saving: {}, writes: {}, recentEdits: {}, distrusts: 0, unverified: false
      });
      store = {
        state: {
          components: { [same]: { text: 'a' }, [changed]: { text: 'old' } },
          schemas: { text: { text: { _has: 'wysiwyg' }, componentVariation: { _has: 'select' } } },
          page: { data: { main: [same, changed] } },
          ui: { currentForm: null }
        },
        commit: jest.fn(),
        dispatch: jest.fn(() => Promise.resolve())
      };
      modelRender.mockImplementation((uri, data) => Promise.resolve(data));
      getMeta.mockImplementation(() => Promise.resolve({}));
      serve({
        [same]: { data: { text: 'a' }, rev: 3 },
        [changed]: { data: { text: 'new' }, rev: 7 },
        [page]: { data: { main: [same, changed] }, rev: 2 }
      });
    });

    test('shows what changed, and learns the revisions of the rest', () => catchUp(store).then((result) => {
      expect(result).toEqual({ changed: [changed], failed: [] });
      expect(store.commit).toHaveBeenCalledWith(UPDATE_COMPONENT, { uri: changed, data: { text: 'new' }, fields: ['text'] });
      expect(store.commit).not.toHaveBeenCalledWith(UPDATE_COMPONENT, expect.objectContaining({ uri: same }));
      expect(store.dispatch).toHaveBeenCalledWith('render', {
        uri: changed, data: { text: 'new' }, snapshot: false, paths: ['text']
      });
      expect(getRev(same)).toBe(3);
      expect(getRev(changed)).toBe(7);
      expect(getRev(page)).toBe(2);
      expect(getMeta).toHaveBeenCalledWith(page);
    }));

    test('leaves a changed component this user has open until they are done, without a revision so their save merges', () => {
      store.state.ui.currentForm = { uri: changed, path: 'text' };

      return catchUp(store).then((result) => {
        expect(result.changed).toEqual([changed]);
        expect(store.commit).toHaveBeenCalledWith(COLLAB_PENDING, { uri: changed, by: {}, rev: 7 });
        expect(store.commit).not.toHaveBeenCalledWith(UPDATE_COMPONENT, expect.objectContaining({ uri: changed }));
        expect(getRev(changed)).toBe(undefined);
      });
    });

    test('says nothing about an open component that did not change', () => {
      store.state.ui.currentForm = { uri: same, path: 'text' };

      return catchUp(store).then(() => {
        expect(store.commit).not.toHaveBeenCalledWith(COLLAB_PENDING, expect.objectContaining({ uri: same }));
        expect(getRev(same)).toBe(3);
      });
    });

    test('only compares what people can edit (kiln has components as the server rendered them)', () => {
      const ad = 'site/_components/ad/instances/a';

      // amphora adds componentVariation when rendering; render hooks add other fields
      store.state.components[same] = { text: 'a', componentVariation: 'text', computed: 'when rendered' };
      store.state.components[ad] = { componentVariation: 'ad', slot: 'top' };
      serve(_.assign({}, server, { [same]: { data: { text: 'a', computed: 'stored' }, rev: 3 }, [ad]: { data: { slot: 'side' }, rev: 1 } }));

      return catchUp(store).then((result) => {
        expect(result).toEqual({ changed: [changed], failed: [] });
        expect(getRev(same)).toBe(3);
      });
    });

    test('reports what it could not re-read, and keeps no revision for it', () => {
      store.state.components[broken] = { text: 'x' };
      serve(_.assign({}, server, { [broken]: new Error('Not Found') }));

      return catchUp(store).then((result) => {
        expect(result.failed).toEqual([broken]);
        expect(getRev(broken)).toBe(undefined);
      });
    });

    test('leaves a component this tab is saving to that save', () => {
      ctx.saving[changed] = 1;

      return catchUp(store).then((result) => {
        expect(result.changed).toEqual([]);
        expect(store.commit).not.toHaveBeenCalledWith(UPDATE_COMPONENT, expect.objectContaining({ uri: changed }));
      });
    });

    test('never goes back to an older version than one it already has', () => {
      setRev(changed, 9);

      return catchUp(store).then(() => {
        expect(store.commit).not.toHaveBeenCalledWith(UPDATE_COMPONENT, expect.objectContaining({ uri: changed }));
        expect(getRev(changed)).toBe(9);
      });
    });

    test('does not trust a revision read before the tab found out (again) that it missed changes', () => {
      let release,
        started;
      const slow = new Promise((resolve) => { release = resolve; }),
        fetching = new Promise((resolve) => { started = resolve; });

      getWithRevision.mockImplementation((url) => {
        if (url === `${same}?hooks=false`) {
          started();

          return slow.then(() => ({ data: { text: 'a' }, rev: 3 }));
        }

        return Promise.resolve(_.cloneDeep(server[url.replace('?hooks=false', '')]));
      });

      const done = catchUp(store);

      return fetching.then(() => {
        distrust();
        release();

        return done;
      }).then(() => expect(getRev(same)).toBe(undefined));
    });
  });
});
