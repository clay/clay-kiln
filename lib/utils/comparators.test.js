import * as lib from './comparators';

describe('comparators', () => {
  describe('isEmpty', () => {
    const fn = lib.isEmpty;

    test(
      'returns false if non-empty string',
      () => expect(fn('hi')).toBe(false)
    );
    test('returns false if any number', () => expect(fn(0)).toBe(false));
    test('returns false if any boolean', () => expect(fn(false)).toBe(false));
    test(
      'returns false if non-empty array',
      () => expect(fn([1, 2, 3])).toBe(false)
    );
    test(
      'returns false if non-empty object',
      () => expect(fn({ a: '1' })).toBe(false)
    );
    test('returns true if empty string', () => expect(fn('')).toBe(true));
    test('returns true if null', () => expect(fn(null)).toBe(true));
    test('returns true if undefined', () => expect(fn('')).toBe(true));
    test('returns true if empty array', () => expect(fn([])).toBe(true));
    test('returns true if empty object', () => expect(fn({})).toBe(true));
    test(
      'returns true if array with empty objects',
      () => expect(fn([{}])).toBe(true)
    );
    test(
      'returns true if array with objects with empty props',
      () => expect(fn([{ foo: '' }])).toBe(true)
    );
    test('returns true if NaN', () => expect(fn(NaN)).toBe(true));
  });

  describe('compare', () => {
    const fn = lib.compare;

    test(
      'throws error if unknown operator',
      () => expect(() => fn({ operator: 'asdf' })).toThrow(Error)
    );

    test('defaults to checking if field has value', () => {
      expect(fn({ data: 'hi' })).toBe(true);
      expect(fn({ data: '' })).toBe(false);
    });

    test('defaults to using the equal operator', () => {
      expect(fn({ data: 1, value: 1 })).toBe(true);
      expect(fn({ data: 1, value: 0 })).toBe(false);
    });

    test('compares equality', () => {
      expect(fn({ data: 1, operator: '===', value: 1 })).toBe(true);
      expect(fn({ data: 1, operator: '!==', value: 0 })).toBe(true);
    });

    test('compares equality by value', () => {
      let obj1 = { a: 'b' },
        obj2 = { a: 'b' };

      expect(obj1).not.toBe(obj2);
      expect(fn({ data: obj1, operator: '===', value: obj2 })).toBe(true);
    });

    test('compares range', () => {
      expect(fn({ data: 1, operator: '<', value: 2 })).toBe(true);
      expect(fn({ data: 1, operator: '>', value: 0 })).toBe(true);
      expect(fn({ data: 1, operator: '<=', value: 1 })).toBe(true);
      expect(fn({ data: 1, operator: '>=', value: 1 })).toBe(true);
    });

    test(
      'compares typeof',
      () => expect(fn({ data: 'hi', operator: 'typeof', value: 'string' })).toBe(true)
    );

    test('compares regex', () => {
      expect(fn({ data: 'hello', operator: 'regex', value: '^hel' })).toBe(true);
      expect(fn({ data: 'hello', operator: 'regex', value: '^hi' })).toBe(false);
    });

    test('compares field emptiness', () => {
      expect(fn({ data: [], operator: 'empty' })).toBe(true);
      expect(fn({ data: false, operator: 'not-empty' })).toBe(true);
    });

    test('compares field truthiness', () => {
      expect(fn({ data: [], operator: 'truthy' })).toBe(true);
      expect(fn({ data: false, operator: 'falsy' })).toBe(true);
    });

    test('compares field length equality', () => {
      expect(fn({ data: [], operator: 'length-equals', value: 0 })).toBe(true);
      expect(fn({ data: ['a'], operator: 'length-equals', value: 1 })).toBe(true);
      expect(fn({ data: false, operator: 'length-equals', value: 0 })).toBe(true);
      expect(fn({ data: null, operator: 'length-equals', value: 0 })).toBe(true);
      expect(fn({ data: undefined, operator: 'length-equals', value: 0 })).toBe(true);
    });

    test('compares field length less than', () => {
      expect(fn({ data: [], operator: 'length-less-than', value: 0 })).toBe(false);
      expect(fn({ data: ['a'], operator: 'length-less-than', value: 0 })).toBe(false);
      expect(fn({ data: ['a'], operator: 'length-less-than', value: 2 })).toBe(true);
      expect(fn({ data: false, operator: 'length-less-than', value: 1 })).toBe(true);
      expect(fn({ data: null, operator: 'length-less-than', value: 1 })).toBe(true);
      expect(fn({ data: undefined, operator: 'length-less-than', value: 1 })).toBe(true);
    });

    test('compares field length greater than', () => {
      expect(fn({ data: [], operator: 'length-greater-than', value: 0 })).toBe(false);
      expect(fn({ data: ['a'], operator: 'length-greater-than', value: 1 })).toBe(false);
      expect(fn({ data: ['a'], operator: 'length-greater-than', value: 0 })).toBe(true);
      expect(fn({ data: false, operator: 'length-greater-than', value: 1 })).toBe(false);
      expect(fn({ data: null, operator: 'length-greater-than', value: 1 })).toBe(false);
      expect(fn({ data: undefined, operator: 'length-greater-than', value: 1 })).toBe(false);
    });
  });
});
