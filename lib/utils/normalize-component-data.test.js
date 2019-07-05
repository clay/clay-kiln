import * as lib from './normalize-component-data';

describe('normalize component data', () => {
  describe('normalize', () => {
    const fn = lib.default;

    test('cleans component lists', () => {
      expect(fn({
        a: [{
          _ref: 'foo',
          b: 'c'
        }]
      })).toEqual({ a: [{ _ref: 'foo' }] });
    });

    test('passes through other arrays', () => {
      const data = { a: ['b', 'c'] };

      expect(fn(data)).toEqual(data);
    });

    test('cleans component props', () => {
      expect(fn({
        a: {
          _ref: 'foo',
          b: 'c'
        }
      })).toEqual({ a: { _ref: 'foo' } });
    });

    test('passes through other objects', () => {
      const data = { a: { b: true, c: true } };

      expect(fn(data)).toEqual(data);
    });

    test('passes through other data', () => {
      const data = {
        a: 'some string',
        b: false,
        c: 0,
        d: null,
        e: '',
        f: [],
        g: {}
      };

      expect(fn(data)).toEqual(data);
    });

    test('removes root-level _ref', () => {
      expect(fn({ _ref: 'foo', a: 'b' })).toEqual({ a: 'b' });
    });
  });
});
