import * as lib from './normalize-component-data';

describe('normalize component data', () => {
  describe('normalize', () => {
    const fn = lib.default;

    it('cleans component lists', () => {
      expect(fn({ a: [{
        _ref: 'foo',
        b: 'c'
      }] })).to.eql({ a: [{ _ref: 'foo' }]});
    });

    it('passes through other arrays', () => {
      const data = { a: ['b', 'c'] };

      expect(fn(data)).to.eql(data);
    });

    it('cleans component props', () => {
      expect(fn({ a: {
        _ref: 'foo',
        b: 'c'
      } })).to.eql({ a: { _ref: 'foo' }});
    });

    it('passes through other objects', () => {
      const data = { a: { b: true, c: true } };

      expect(fn(data)).to.eql(data);
    });

    it('passes through other data', () => {
      const data = {
        a: 'some string',
        b: false,
        c: 0,
        d: null,
        e: '',
        f: [],
        g: {}
      };

      expect(fn(data)).to.eql(data);
    });

    it('removes root-level _ref', () => {
      expect(fn({ _ref: 'foo', a: 'b' })).to.eql({ a: 'b' });
    });
  });
});
