import * as lib from './save';
import ctx, {
  setRev, getRev, isSaving, distrust, markOutOfTouch, isOutOfTouch, takenOver
} from './context';
import { saveWithRevision } from '../core-data/api';

jest.mock('../core-data/api');
jest.mock('../core-data/connection', () => ({ holdWhileUnreachable: fn => fn() }));
// like kiln's queue: one task at a time, in order
jest.mock('../core-data/queue', () => {
  let last = Promise.resolve();

  return {
    add: (fn, args) => {
      const run = last.then(() => fn(...args));

      last = run.catch(() => {});

      return run;
    }
  };
});

const uri = 'site/_components/article/instances/a',
  page = 'site/_pages/p',
  ada = { id: 'u-ada', name: 'Ada Lovelace' };

/**
 * a rejected save like kiln's api throws on a 412
 * @param {object} body
 * @returns {Promise}
 */
function conflict(body) {
  const error = new Error('Precondition Failed');

  error.response = { status: 412, json: () => Promise.resolve(body) };

  return Promise.reject(error);
}

describe('collab save', () => {
  beforeEach(() => {
    ctx.session = 'session1';
    ctx.revs = {};
    ctx.saving = {};
    ctx.successors = {};
    ctx.unguarded = {};
    ctx.unverified = false;
    ctx.distrusts = 0;
    ctx.gap = null;
    ctx.outOfTouch = {};
    ctx.store = null;
    ctx.unreachable = false;
    ctx.tab = null;
    saveWithRevision.mockReset();
  });

  describe('saveWithMerge', () => {
    const fn = lib.saveWithMerge;

    test('saves with the base revision and remembers the new one', () => {
      setRev(uri, 3);
      saveWithRevision.mockReturnValue(Promise.resolve({ data: {}, rev: 4 }));

      return fn({
        uri, data: { title: 'b' }, base: { title: 'a' }, paths: ['title'], hooks: false, doc: page, baseRev: 3
      }).then((result) => {
        expect(saveWithRevision).toHaveBeenCalledWith(uri, { title: 'b' }, false, {
          'X-Clay-Collab-Session': 'session1',
          'X-Clay-Collab-Doc': page,
          'X-Clay-Rev': '3'
        });
        expect(result).toEqual({
          data: { title: 'b' }, merged: false, conflicts: [], theirs: null, rev: 4
        });
        expect(getRev(uri)).toBe(4);
        expect(isSaving(uri)).toBe(false);
      });
    });

    test('saves without a revision when it does not know one', () => {
      saveWithRevision.mockReturnValue(Promise.resolve({ data: {}, rev: 1 }));

      return fn({
        uri, data: { title: 'b' }, base: {}, paths: ['title'], hooks: false, doc: page
      }).then(() => {
        expect(saveWithRevision.mock.calls[0][3]).not.toHaveProperty('X-Clay-Rev');
      });
    });

    test('merges with what someone else saved, and retries on their revision', () => {
      setRev(uri, 3);
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 5, data: { title: 'a', teaser: 'theirs' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 6 }));

      return fn({
        uri, data: { title: 'mine', teaser: 'old' }, base: { title: 'a', teaser: 'old' }, paths: ['title'], hooks: false, doc: page, baseRev: 3
      }).then((result) => {
        expect(saveWithRevision.mock.calls[0][3]['X-Clay-Rev']).toBe('3');
        expect(saveWithRevision.mock.calls[1][1]).toEqual({ title: 'mine', teaser: 'theirs' });
        expect(saveWithRevision.mock.calls[1][3]['X-Clay-Rev']).toBe('5');
        expect(result).toEqual({
          data: { title: 'mine', teaser: 'theirs' }, merged: true, conflicts: [], theirs: { title: 'a', teaser: 'theirs' }, rev: 6
        });
        // the store doesn't have their teaser yet: applying the merge sets the revision
        expect(getRev(uri)).toBe(3);
      });
    });

    test('never lands changes from before this tab was out of touch on top of a newer change to the same field', () => {
      setRev(uri, 3);
      markOutOfTouch([uri]);
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 5, data: { title: 'theirs', teaser: 'old' }, by: { user: ada } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 6 }));

      return fn({
        uri, data: { title: 'mine', teaser: 'mine too' }, base: { title: 'a', teaser: 'old' }, paths: ['title', 'teaser'], hooks: false, doc: page, baseRev: 3
      }).then((result) => {
        expect(saveWithRevision.mock.calls[1][1]).toEqual({ title: 'theirs', teaser: 'mine too' });
        expect(result.conflicts).toEqual([{
          path: 'title', mine: 'mine', theirs: 'theirs', kept: 'theirs'
        }]);
        expect(result.by).toEqual({ user: ada });
        expect(isOutOfTouch(uri)).toBe(false); // settled: saved, and no form open on it
      });
    });

    test('leaves out a field someone took over while this tab was away, and says so (no "kept your version")', () => {
      markOutOfTouch([uri]);
      ctx.syncedAt = Date.now() + 1;
      ctx.tab = 'tab5';
      ctx.clock = 0;
      ctx.store = {
        state: {
          ui: {},
          collab: {
            others: [{
              tab: 'tab9', user: ada, seen: Date.now(), focus: { uri, path: 'title', over: ['tab5'] }
            }]
          }
        }
      };
      saveWithRevision.mockReturnValue(Promise.resolve({ data: {}, rev: 4 }));

      return fn({
        uri, data: { title: 'mine', teaser: 'mine too' }, base: { title: 'a', teaser: 'old' }, paths: ['title', 'teaser'], hooks: false, doc: page, baseRev: 3
      }).then((result) => {
        expect(saveWithRevision.mock.calls[0][1]).toEqual({ title: 'a', teaser: 'mine too' });
        expect(result).toMatchObject({
          data: { title: 'a', teaser: 'mine too' }, merged: true, by: { user: ada }
        });
        expect(result.conflicts).toEqual([{
          path: 'title', mine: 'mine', theirs: 'a', kept: 'theirs'
        }]);
      });
    });

    test('does not save at all when the only field it changed was taken over', () => {
      ctx.tab = 'tab5';
      ctx.store = {
        state: {
          ui: {},
          collab: {
            others: [{
              tab: 'tab9', user: ada, seen: Date.now(), focus: { uri, path: null, over: ['tab5'] }
            }]
          }
        }
      };

      return fn({
        uri, data: { title: 'mine' }, base: { title: 'a' }, paths: ['title'], hooks: false, doc: page, baseRev: 3
      }).then((result) => {
        expect(saveWithRevision).not.toHaveBeenCalled();
        expect(result).toMatchObject({ data: { title: 'a' }, merged: true, conflicts: [{ path: 'title', kept: 'theirs' }] });
      });
    });

    test('waits, like a save that can\'t reach the CMS, until it has heard who has what since it was out of touch', () => {
      markOutOfTouch([uri]);
      ctx.syncedAt = 0;
      ctx.unreachable = true;

      expect(() => takenOver(uri, ['title'])).toThrow('Waiting to hear who has this open');
      ctx.unreachable = false;
      expect(takenOver(uri, ['title'])).toEqual({ fields: [], by: null });
    });

    test('stays out of touch while a form is still open on it (its changes are from before too)', () => {
      markOutOfTouch([uri]);
      ctx.store = { state: { ui: { currentForm: { uri, path: 'title' } } } };
      saveWithRevision.mockReturnValue(Promise.resolve({ data: {}, rev: 1 }));

      return fn({
        uri, data: { teaser: 'x' }, base: {}, paths: ['teaser'], hooks: false, doc: page
      }).then(() => expect(isOutOfTouch(uri)).toBe(true));
    });

    test('follows this tab\'s own clean saves to the newest revision', () => {
      setRev(uri, 3);
      saveWithRevision
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 4 }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 5 }));

      // the second save was built (from the store, at rev 3) before the first one finished
      return Promise.all([
        fn({
          uri, data: { a: 1 }, base: {}, paths: ['a'], hooks: false, doc: page, baseRev: 3, optimistic: true
        }),
        fn({
          uri, data: { a: 1, b: 2 }, base: { a: 1 }, paths: ['b'], hooks: false, doc: page, baseRev: 3, optimistic: true
        })
      ]).then(() => {
        expect(saveWithRevision.mock.calls[1][3]['X-Clay-Rev']).toBe('4');
        expect(getRev(uri)).toBe(5);
      });
    });

    test('does not skip past a save that had to be merged', () => {
      setRev(uri, 3);
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 4, data: { a: 0, theirs: 'x' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 5 }))
        .mockReturnValueOnce(conflict({ rev: 5, data: { a: 1, theirs: 'x' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 6 }));

      return Promise.all([
        fn({
          uri, data: { a: 1 }, base: { a: 0 }, paths: ['a'], hooks: false, doc: page, baseRev: 3, optimistic: true
        }),
        fn({
          uri, data: { a: 1, b: 2 }, base: { a: 1 }, paths: ['b'], hooks: false, doc: page, baseRev: 3, optimistic: true
        })
      ]).then(([, second]) => {
        // the second save went out on rev 3, got 412 and kept their field
        expect(saveWithRevision.mock.calls[2][3]['X-Clay-Rev']).toBe('3');
        expect(second.data).toEqual({ a: 1, b: 2, theirs: 'x' });
      });
    });

    test('reports fields we both changed', () => {
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 2, data: { title: 'theirs' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 3 }));

      return fn({
        uri, data: { title: 'mine' }, base: { title: 'a' }, paths: ['title'], hooks: false, doc: page
      }).then((result) => {
        expect(result.data).toEqual({ title: 'mine' });
        expect(result.conflicts).toEqual([{ path: 'title', mine: 'mine', theirs: 'theirs' }]);
      });
    });

    test('keeps merging if someone saves again in between', () => {
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 2, data: { a: 1, b: 'x' } }))
        .mockReturnValueOnce(conflict({ rev: 3, data: { a: 1, b: 'x', c: 'new' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 4 }));

      return fn({
        uri, data: { a: 2 }, base: { a: 1 }, paths: ['a'], hooks: false, doc: page
      }).then((result) => {
        expect(result.data).toEqual({ a: 2, b: 'x', c: 'new' });
        expect(result.rev).toBe(4);
      });
    });

    test('runs the component\'s model.save again on merged data', () => {
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 2, data: { title: 'theirs', slug: 'theirs' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 3 }));

      return fn({
        uri,
        data: { title: 'a', teaser: 'mine', slug: 'a' },
        base: { title: 'a', teaser: 'old', slug: 'a' },
        paths: ['teaser'],
        hooks: false,
        doc: page,
        // e.g. a model that derives the slug from the title
        prepare: merged => Promise.resolve(Object.assign({}, merged, { slug: merged.title.toLowerCase() }))
      }).then((result) => {
        expect(saveWithRevision.mock.calls[1][1]).toEqual({ title: 'theirs', teaser: 'mine', slug: 'theirs' });
        expect(result.data).toEqual({ title: 'theirs', teaser: 'mine', slug: 'theirs' });
      });
    });

    test('saves its own data when nothing is saved on the server', () => {
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 0, data: null, missing: true }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 1 }));

      return fn({
        uri, data: { a: 2 }, base: {}, paths: ['a'], hooks: false, doc: page
      }).then((result) => {
        expect(saveWithRevision.mock.calls[1][1]).toEqual({ a: 2 });
        expect(saveWithRevision.mock.calls[1][3]['X-Clay-Rev']).toBe('0');
        expect(result.data).toEqual({ a: 2 });
      });
    });

    test('asks for the server\'s data (-1) when it exists but its revision is unknown', () => {
      ctx.known = { [uri]: true };
      saveWithRevision.mockReturnValue(Promise.resolve({ data: {}, rev: 3 }));

      return fn({
        uri, data: { a: 2 }, base: {}, paths: ['a'], hooks: false, doc: page
      }).then(() => {
        expect(saveWithRevision.mock.calls[0][3]['X-Clay-Rev']).toBe('-1');
        ctx.known = {};
      });
    });

    test('saves its own data when the server has none', () => {
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 2, data: null }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 3 }));

      return fn({
        uri, data: { a: 2, b: 1 }, base: { a: 1, b: 1 }, paths: ['a'], hooks: false, doc: page
      }).then((result) => {
        expect(result.data).toEqual({ a: 2, b: 1 });
      });
    });

    test('gives up after a few conflicts in a row', () => {
      saveWithRevision.mockImplementation(() => conflict({ rev: 9, data: { a: 1 } }));

      return fn({
        uri, data: { a: 2 }, base: { a: 1 }, paths: ['a'], hooks: false, doc: page
      }).then(() => {
        throw new Error('should have failed');
      }, (err) => {
        expect(err.message).toBe('Precondition Failed');
        expect(saveWithRevision).toHaveBeenCalledTimes(lib.MAX_ATTEMPTS);
        expect(isSaving(uri)).toBe(false);
      });
    });

    test('notes a save that came back without a revision, to report it and re-read the page', () => {
      setRev(uri, 3);
      saveWithRevision.mockReturnValue(Promise.resolve({ data: {}, rev: null }));

      return fn({
        uri, data: { a: 2 }, base: { a: 1 }, paths: ['a'], hooks: false, doc: page, baseRev: 3
      }).then(() => {
        expect(ctx.unguarded).toEqual({ [uri]: { doc: page, at: expect.any(Number) } });
        expect(ctx.unverified).toBe(true);
        // nothing this tab has is known to be current any more
        expect(getRev(uri)).toBe(undefined);
      });
    });

    test('merges a save built before the tab found out it may have missed changes', () => {
      ctx.known = { [uri]: true };
      setRev(uri, 3);
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 3, data: { a: 1, b: 'theirs' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 4 }));

      const saving = fn({
        uri, data: { a: 2, b: 1 }, base: { a: 1, b: 1 }, paths: ['a'], hooks: false, doc: page, baseRev: 3
      });

      // e.g. the next sync says saves went around collaboration
      distrust();

      return saving.then((result) => {
        expect(saveWithRevision.mock.calls[0][3]['X-Clay-Rev']).toBe('-1');
        expect(result.data).toEqual({ a: 2, b: 'theirs' });
        ctx.known = {};
      });
    });

    test('sends the gap its revisions come from, and re-reads the page when a 412 says it changed', () => {
      ctx.gap = 'g1';
      setRev(uri, 3);
      saveWithRevision
        .mockReturnValueOnce(conflict({ rev: 3, gap: 'g2', data: { a: 1, b: 'theirs' } }))
        .mockReturnValueOnce(Promise.resolve({ data: {}, rev: 4 }));

      return fn({
        uri, data: { a: 2, b: 1 }, base: { a: 1, b: 1 }, paths: ['a'], hooks: false, doc: page, baseRev: 3
      }).then((result) => {
        expect(saveWithRevision.mock.calls[0][3]).toMatchObject({ 'X-Clay-Rev': '3', 'X-Clay-Collab-Gap': 'g1' });
        expect(saveWithRevision.mock.calls[1][3]).toMatchObject({ 'X-Clay-Rev': '3', 'X-Clay-Collab-Gap': 'g2' });
        expect(result.data).toEqual({ a: 2, b: 'theirs' });
        expect(ctx.gap).toBe('g2');
        expect(ctx.unverified).toBe(true);
      });
    });

    test('passes other errors through', () => {
      const error = new Error('Server Error');

      error.response = { status: 500 };
      saveWithRevision.mockReturnValue(Promise.reject(error));

      return fn({
        uri, data: { a: 2 }, base: { a: 1 }, paths: ['a'], hooks: false, doc: page
      }).catch((err) => {
        expect(err).toBe(error);
        expect(saveWithRevision).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('theirChanges', () => {
    test('lists fields they changed, minus conflicts', () => {
      expect(lib.theirChanges({ a: 1, b: 1, c: 1 }, { a: 2, b: 2, c: 1 }, [{ path: 'b' }])).toEqual(['a']);
    });

    test('includes conflicts where theirs was kept', () => {
      expect(lib.theirChanges({ a: 1, b: 1 }, { a: 2, b: 2 }, [{ path: 'b', kept: 'theirs' }])).toEqual(['a', 'b']);
    });
  });
});
