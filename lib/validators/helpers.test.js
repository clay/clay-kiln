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

  describe('getInput', () => {
    const fn = lib.getInput;

    it('returns null if no inputs', () => {
      expect(fn('foo', { _has: {} })).to.equal(null);
    });

    it('returns null if input not found in root', () => {
      expect(fn('foo', { _has: 'text' })).to.equal(null);
    });

    it('returns null if input not found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'text'
        }]
      } })).to.equal(null);
    });

    it('returns null if input not found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'text'
            }]
          }
        }]
      } })).to.equal(null);
    });

    it('returns input config if input found in root', () => {
      expect(fn('foo', { _has: 'foo' })).to.eql({ input: 'foo' });
    });

    it('returns input config if input found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'foo'
        }]
      } })).to.eql({ input: 'foo', _path: 'someProp' });
    });

    it('returns input config if input found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'foo'
            }]
          }
        }]
      } })).to.eql({ input: 'foo', _path: 'someProp.someOtherProp' });
    });
  });

  describe('hasInput', () => {
    const fn = lib.hasInput;

    it('returns false if no inputs', () => {
      expect(fn('foo', { _has: {} })).to.equal(false);
    });

    it('returns false if input not found in root', () => {
      expect(fn('foo', { _has: 'text' })).to.equal(false);
    });

    it('returns false if input not found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'text'
        }]
      } })).to.equal(false);
    });

    it('returns false if input not found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'text'
            }]
          }
        }]
      } })).to.equal(false);
    });

    it('returns true if input found in root', () => {
      expect(fn('foo', { _has: 'foo' })).to.equal(true);
    });

    it('returns true if input found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'foo'
        }]
      } })).to.equal(true);
    });

    it('returns true if input found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
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
