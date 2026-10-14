import * as lib from './save';
import ctx, { setRev, getRev, isSaving } from './context';
import { saveWithRevision } from '../core-data/api';

jest.mock('../core-data/api');
jest.mock('../core-data/queue', () => ({ add: (fn, args) => fn(...args) }));

const uri = 'site/_components/article/instances/a',
  page = 'site/_pages/p';

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
    saveWithRevision.mockReset();
  });

  describe('saveWithMerge', () => {
    const fn = lib.saveWithMerge;

    test('saves with the base revision and remembers the new one', () => {
      setRev(uri, 3);
      saveWithRevision.mockReturnValue(Promise.resolve({ data: {}, rev: 4 }));

      return fn({
        uri, data: { title: 'b' }, base: { title: 'a' }, paths: ['title'], hooks: false, doc: page
      }).then((result) => {
        expect(saveWithRevision).toHaveBeenCalledWith(uri, { title: 'b' }, false, {
          'X-Clay-Collab-Session': 'session1',
          'X-Clay-Collab-Doc': page,
          'X-Clay-Rev': '3'
        });
        expect(result).toEqual({
          data: { title: 'b' }, merged: false, conflicts: [], theirs: null
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
        uri, data: { title: 'mine', teaser: 'old' }, base: { title: 'a', teaser: 'old' }, paths: ['title'], hooks: false, doc: page
      }).then((result) => {
        expect(saveWithRevision.mock.calls[1][1]).toEqual({ title: 'mine', teaser: 'theirs' });
        expect(saveWithRevision.mock.calls[1][3]['X-Clay-Rev']).toBe('5');
        expect(result).toEqual({
          data: { title: 'mine', teaser: 'theirs' }, merged: true, conflicts: [], theirs: { title: 'a', teaser: 'theirs' }
        });
        expect(getRev(uri)).toBe(6);
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
        expect(getRev(uri)).toBe(4);
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
  });
});
