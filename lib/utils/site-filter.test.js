import * as lib from './site-filter';

describe('references', () => {
  describe('filterBySite', () => {
    const fn = lib.filterBySite;

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
  });
});
