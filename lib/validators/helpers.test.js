import * as lib from './helpers';

describe('validation helpers', () => {
  describe('getPreviewText', () => {
    const fn = lib.getPreviewText;

    it('returns the full text if short', () => {
      expect(fn('hello', 0, 0)).to.equal('hello');
    });

    it('truncates text', () => {
      expect(fn('O brave new world, that has such people in\'t!', 21, 0)).to.equal('… brave new world, that has such people i…');
    });
  });

  describe('getBehavior', () => {
    const fn = lib.getBehavior;

    it('returns null if no behaviors', () => {
      expect(fn('foo', { _has: [] })).to.equal(null);
    });

    it('returns null if behavior not found in root', () => {
      expect(fn('foo', { _has: 'text' })).to.equal(null);
    });

    it('returns null if behavior not found in complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'text'
        }]
      } })).to.equal(null);
    });

    it('returns null if behavior not found in nested complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            fn: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'text'
            }]
          }
        }]
      } })).to.equal(null);
    });

    it('returns behavior config if behavior found in root', () => {
      expect(fn('foo', { _has: 'foo' })).to.eql({ fn: 'foo', args: {}});
    });

    it('returns behavior config if behavior found in complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'foo'
        }]
      } })).to.eql({ fn: 'foo', args: {}, _path: 'someProp' });
    });

    it('returns behavior config if behavior found in nested complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            fn: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'foo'
            }]
          }
        }]
      } })).to.eql({ fn: 'foo', args: {}, _path: 'someProp.someOtherProp' });
    });
  });

  describe('hasBehavior', () => {
    const fn = lib.hasBehavior;

    it('returns false if no behaviors', () => {
      expect(fn('foo', { _has: [] })).to.equal(false);
    });

    it('returns false if behavior not found in root', () => {
      expect(fn('foo', { _has: 'text' })).to.equal(false);
    });

    it('returns false if behavior not found in complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'text'
        }]
      } })).to.equal(false);
    });

    it('returns false if behavior not found in nested complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            fn: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'text'
            }]
          }
        }]
      } })).to.equal(false);
    });

    it('returns true if behavior found in root', () => {
      expect(fn('foo', { _has: 'foo' })).to.equal(true);
    });

    it('returns true if behavior found in complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'foo'
        }]
      } })).to.equal(true);
    });

    it('returns true if behavior found in nested complex list', () => {
      expect(fn('foo', { _has: {
        fn: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            fn: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'foo'
            }]
          }
        }]
      } })).to.equal(true);
    });
  });

  describe('getListProps', () => {
    const fn = lib.getListProps;

    it('returns null if no complex-list', () => {
      expect(fn({})).to.equal(null);
    });
  });
});
