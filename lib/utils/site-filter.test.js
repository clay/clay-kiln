import * as lib from './site-filter';

describe('references', () => {
  describe('filterBySite', () => {
    const fn = lib.filterBySite,
      obj1 = { text: 'One', value: 'one' },
      obj2 = { text: 'Two', value: 'two', sites: 'foo' },
      obj3 = { text: 'Three', value: 'three', sites: 'not:foo' },
      obj4 = { text: 'Four', value: 'four', sites: 'foo, bar' };

    it('returns all items if no sites', () => {
      // note: all characters except parenthesis are allowed in item names
      expect(fn(['one', 'tw-o', 'th ree 3'], 'foo')).to.eql(['one', 'tw-o', 'th ree 3']);
    });

    it('returns only specific site items', () => {
      expect(fn([
        'one (foo)',
        'tw-o (bar)',
        'th ree 3 (foo)'
      ], 'foo')).to.eql(['one', 'th ree 3']);
    });

    it('returns specific site items and general items', () => {
      expect(fn([
        'one (foo)',
        'tw-o',
        'th ree 3 (foo)'
      ], 'foo')).to.eql(['one', 'tw-o', 'th ree 3']);
    });

    it('does not return excluded items', () => {
      expect(fn([
        'one (foo)',
        'tw-o (not:foo)',
        'th ree 3 (not: foo)'
      ], 'foo')).to.eql(['one']);
    });

    it('trims site slugs', () => {
      expect(fn(['one ( foo  )'], 'foo')).to.eql(['one']);
    });

    it('trims item value', () => {
      expect(fn([' one two  ( foo  )'], 'foo')).to.eql(['one two']);
    });

    it('returns all items (objects)', () => {
      expect(fn([obj1], 'foo')).to.eql([obj1]);
    });

    it('returns specific site items (objects)', () => {
      expect(fn([obj1, obj2, obj4], 'foo')).to.eql([obj1, obj2, obj4]);
    });

    it('does not return excluded items (objects)', () => {
      expect(fn([obj1, obj3], 'foo')).to.eql([obj1]);
    });

    it('trims object sites', () => {
      const longLogic = {
        text: 'OK',
        value: 'ok',
        sites: ' foo, not: bar '
      };

      expect(fn([longLogic], 'foo')).to.eql([longLogic]);
      expect(fn([longLogic], 'bar')).to.eql([]);
    });

    it('does not trim object text or value', () => {
      const funnyObject = {
        text: ' Hark! A Vagrant! ',
        value: ' By Kate Beaton '
      };

      expect(fn([funnyObject], 'foo')).to.eql([funnyObject]);
    });

    it('allows emptystring values', () => {
      expect(fn([''], 'foo')).to.eql(['']);
    });
  });
});
