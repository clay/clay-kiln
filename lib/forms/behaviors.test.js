import * as lib from './behaviors';

describe('behaviors', () => {
  describe('add', () => {
    const fn = lib.add;

    beforeEach(() => {
      // clear out behaviors before each test
      window.kiln.behaviors = {};
    });

    it('adds behaviors to the global kiln.behaviors object', () => {
      fn('foo', { a: 'b' });
      expect(window.kiln.behaviors.foo).to.eql({ a: 'b' });
    });
  });
});
