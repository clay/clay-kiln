import * as lib from './merge';

const a = { _ref: 'site/_components/p/instances/a' },
  b = { _ref: 'site/_components/p/instances/b' },
  c = { _ref: 'site/_components/p/instances/c' },
  d = { _ref: 'site/_components/p/instances/d' },
  e = { _ref: 'site/_components/p/instances/e' };

describe('collab merge', () => {
  describe('mergeData', () => {
    const fn = lib.mergeData;

    test('keeps fields only they changed and applies fields only I changed', () => {
      const base = { title: 'one', teaser: 'old', byline: 'x' },
        mine = { title: 'two', teaser: 'old', byline: 'x' },
        theirs = { title: 'one', teaser: 'new', byline: 'x' };

      expect(fn({
        base, mine, theirs, paths: ['title']
      })).toEqual({
        data: { title: 'two', teaser: 'new', byline: 'x' },
        conflicts: []
      });
    });

    test('is a conflict when we both change the same field: mine wins, theirs is reported', () => {
      const base = { title: 'one' },
        mine = { title: 'mine' },
        theirs = { title: 'theirs' };

      expect(fn({
        base, mine, theirs, paths: ['title']
      })).toEqual({
        data: { title: 'mine' },
        conflicts: [{ path: 'title', mine: 'mine', theirs: 'theirs' }]
      });
    });

    test('keeps theirs (the newer one) when mine is from before I was out of touch, and reports mine', () => {
      expect(fn({
        base: { title: 'one', teaser: 'a' }, mine: { title: 'mine', teaser: 'b' }, theirs: { title: 'theirs', teaser: 'a' }, paths: ['title', 'teaser'], preferTheirs: true
      })).toEqual({
        data: { title: 'theirs', teaser: 'b' },
        conflicts: [{
          path: 'title', mine: 'mine', theirs: 'theirs', kept: 'theirs'
        }]
      });
    });

    test('is not a conflict when we made the same change', () => {
      expect(fn({
        base: { title: 'one' }, mine: { title: 'same' }, theirs: { title: 'same' }, paths: ['title']
      }).conflicts).toEqual([]);
    });

    test('keeps theirs for a listed path I did not actually change', () => {
      expect(fn({
        base: { title: 'one' }, mine: { title: 'one' }, theirs: { title: 'two' }, paths: ['title']
      }).data).toEqual({ title: 'two' });
    });

    test('works out the changed paths when none are given', () => {
      expect(fn({ base: { title: 'one', teaser: 'x' }, mine: { title: 'two', teaser: 'x' }, theirs: { title: 'one', teaser: 'y' } }).data).toEqual({ title: 'two', teaser: 'y' });
    });

    test('removes a field I removed (if they did not change it)', () => {
      expect(fn({
        base: { title: 'one', extra: 1 }, mine: { title: 'one' }, theirs: { title: 'two', extra: 1 }, paths: ['extra']
      }).data).toEqual({ title: 'two' });
    });

    test('merges component lists we both changed', () => {
      const base = { content: [a, b, c] },
        mine = { content: [a, b, d, c] }, // I added d after b
        theirs = { content: [a, c, e] }; // they removed b and added e at the end

      expect(fn({
        base, mine, theirs, paths: ['content']
      })).toEqual({
        data: { content: [a, d, c, e] },
        conflicts: []
      });
    });

    test('merges page areas (lists of uris)', () => {
      const base = { main: ['x', 'y'] },
        mine = { main: ['x', 'y', 'mine'] },
        theirs = { main: ['theirs', 'x', 'y'] };

      expect(fn({
        base, mine, theirs, paths: ['main']
      }).data).toEqual({ main: ['theirs', 'x', 'y', 'mine'] });
    });

    test('treats lists without refs as a single value', () => {
      const result = fn({
        base: { tags: [{ text: 'a' }] }, mine: { tags: [{ text: 'b' }] }, theirs: { tags: [{ text: 'c' }] }, paths: ['tags']
      });

      expect(result.data).toEqual({ tags: [{ text: 'b' }] });
      expect(result.conflicts.length).toBe(1);
    });

    test('handles missing base and theirs', () => {
      expect(fn({
        base: null, mine: { title: 'x' }, theirs: null, paths: ['title']
      })).toEqual({ data: { title: 'x' }, conflicts: [] });
    });
  });

  describe('mergeList', () => {
    const fn = lib.mergeList;

    test('applies my removals to their list', () => {
      expect(fn([a, b, c], [a, c], [a, b, c, d]).list).toEqual([a, c, d]);
    });

    test('inserts my additions after the item before them in my list', () => {
      expect(fn([a, b], [a, d, b], [e, a, b]).list).toEqual([e, a, d, b]);
    });

    test('inserts my addition at the start when nothing precedes it', () => {
      expect(fn([a, b], [d, a, b], [a, b, e]).list).toEqual([d, a, b, e]);
    });

    test('keeps my addition when the item before it was removed by them', () => {
      expect(fn([a, b, c], [a, b, d, c], [a, c]).list).toEqual([a, d, c]);
    });

    test('does not duplicate something we both added', () => {
      expect(fn([a], [a, d], [a, d]).list).toEqual([a, d]);
    });

    test('applies my reorder when they only added/removed', () => {
      // I moved c to the top; they added e
      expect(fn([a, b, c], [c, a, b], [a, b, c, e])).toEqual({ list: [c, a, b, e], conflict: false });
    });

    test('keeps their order (and flags it) when we both reordered differently', () => {
      expect(fn([a, b, c], [c, a, b], [b, a, c])).toEqual({ list: [b, a, c], conflict: true });
    });

    test('is not a conflict when we reordered the same way', () => {
      expect(fn([a, b, c], [c, b, a], [c, b, a]).conflict).toBe(false);
    });
  });

  describe('isMergeableList', () => {
    test('is true for uri strings and ref objects', () => {
      expect(lib.isMergeableList(['x'], [a], undefined, null)).toBe(true);
    });

    test('is false for other arrays', () => {
      expect(lib.isMergeableList([{ text: 'a' }])).toBe(false);
      expect(lib.isMergeableList('x')).toBe(false);
    });
  });

  describe('changedFields', () => {
    test('lists top-level fields that differ', () => {
      expect(lib.changedFields({ a: 1, b: { c: 2 }, d: 3 }, { a: 1, b: { c: 3 }, e: 4 }).sort()).toEqual(['b', 'd', 'e']);
    });

    test('handles empty inputs', () => {
      expect(lib.changedFields(null, { a: 1 })).toEqual(['a']);
    });
  });
});
