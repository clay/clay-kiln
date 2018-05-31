import * as lib from './site-filter';

describe('references', () => {
  describe('filterBySite', () => {
    const fn = lib.filterBySite,
      obj1 = { text: 'One', value: 'one' },
      obj2 = { text: 'Two', value: 'two', sites: 'foo' },
      obj3 = { text: 'Three', value: 'three', sites: 'not:foo' },
      obj4 = { text: 'Four', value: 'four', sites: 'foo, bar' };

    test('returns all items if no sites', () => {
      // note: all characters except parenthesis are allowed in item names
      expect(fn(['one', 'tw-o', 'th ree 3'], 'foo')).toEqual(['one', 'tw-o', 'th ree 3']);
    });

    test('returns only specific site items', () => {
      expect(fn([
        'one (foo)',
        'tw-o (bar)',
        'th ree 3 (foo)'
      ], 'foo')).toEqual(['one', 'th ree 3']);
    });

    test('returns specific site items and general items', () => {
      expect(fn([
        'one (foo)',
        'tw-o',
        'th ree 3 (foo)'
      ], 'foo')).toEqual(['one', 'tw-o', 'th ree 3']);
    });

    test('does not return excluded items', () => {
      expect(fn([
        'one (foo)',
        'tw-o (not:foo)',
        'th ree 3 (not: foo)'
      ], 'foo')).toEqual(['one']);
    });

    test('trims site slugs', () => {
      expect(fn(['one ( foo  )'], 'foo')).toEqual(['one']);
    });

    test('trims item value', () => {
      expect(fn([' one two  ( foo  )'], 'foo')).toEqual(['one two']);
    });

    test('returns all items (objects)', () => {
      expect(fn([obj1], 'foo')).toEqual([obj1]);
    });

    test('returns specific site items (objects)', () => {
      expect(fn([obj1, obj2, obj4], 'foo')).toEqual([obj1, obj2, obj4]);
    });

    test('does not return excluded items (objects)', () => {
      expect(fn([obj1, obj3], 'foo')).toEqual([obj1]);
    });

    test('trims object sites', () => {
      const longLogic = {
        text: 'OK',
        value: 'ok',
        sites: ' foo, not: bar '
      };

      expect(fn([longLogic], 'foo')).toEqual([longLogic]);
      expect(fn([longLogic], 'bar')).toEqual([]);
    });

    test('does not trim object text or value', () => {
      const funnyObject = {
        text: ' Hark! A Vagrant! ',
        value: ' By Kate Beaton '
      };

      expect(fn([funnyObject], 'foo')).toEqual([funnyObject]);
    });

    test('allows emptystring values', () => {
      expect(fn([''], 'foo')).toEqual(['']);
    });
  });
});
