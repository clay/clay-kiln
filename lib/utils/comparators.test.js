import expect from 'expect';
import * as lib from './comparators';

describe('comparators', () => {
  describe('isEmpty', () => {
    const fn = lib.isEmpty;

    test(
      'returns false if non-empty string',
      () => expect(fn('hi')).to.equal(false)
    );
    test('returns false if any number', () => expect(fn(0)).to.equal(false));
    test('returns false if any boolean', () => expect(fn(false)).to.equal(false));
    test(
      'returns false if non-empty array',
      () => expect(fn([1, 2, 3])).to.equal(false)
    );
    test(
      'returns false if non-empty object',
      () => expect(fn({ a: '1' })).to.equal(false)
    );
    test('returns true if empty string', () => expect(fn('')).to.equal(true));
    test('returns true if null', () => expect(fn(null)).to.equal(true));
    test('returns true if undefined', () => expect(fn('')).to.equal(true));
    test('returns true if empty array', () => expect(fn([])).to.equal(true));
    test('returns true if empty object', () => expect(fn({})).to.equal(true));
    test(
      'returns true if array with empty objects',
      () => expect(fn([{}])).to.equal(true)
    );
    test(
      'returns true if array with objects with empty props',
      () => expect(fn([{ foo: '' }])).to.equal(true)
    );
  });

  describe('compare', () => {
    const fn = lib.compare;

    test(
      'throws error if unknown operator',
      () => expect(() => fn({ operator: 'asdf' })).to.throw(Error)
    );

    test('defaults to checking if field has value', () => {
      expect(fn({data: 'hi'})).to.equal(true);
      expect(fn({data: ''})).to.equal(false);
    });

    test('defaults to using the equal operator', () => {
      expect(fn({data: 1, value: 1})).to.equal(true);
      expect(fn({data: 1, value: 0})).to.equal(false);
    });

    test('compares equality', () => {
      expect(fn({data: 1, operator: '===', value: 1})).to.equal(true);
      expect(fn({data: 1, operator: '!==', value: 0})).to.equal(true);
    });

    test('compares range', () => {
      expect(fn({data: 1, operator: '<', value: 2})).to.equal(true);
      expect(fn({data: 1, operator: '>', value: 0})).to.equal(true);
      expect(fn({data: 1, operator: '<=', value: 1})).to.equal(true);
      expect(fn({data: 1, operator: '>=', value: 1})).to.equal(true);
    });

    test(
      'compares typeof',
      () => expect(fn({data: 'hi', operator: 'typeof', value: 'string'})).to.equal(true)
    );

    test('compares regex', () => {
      expect(fn({data: 'hello', operator: 'regex', value: '^hel'})).to.equal(true);
      expect(fn({data: 'hello', operator: 'regex', value: '^hi'})).to.equal(false);
    });

    test('compares field emptiness', () => {
      expect(fn({data: [], operator: 'empty'})).to.equal(true);
      expect(fn({data: false, operator: 'not-empty'})).to.equal(true);
    });

    test('compares field truthiness', () => {
      expect(fn({data: [], operator: 'truthy'})).to.equal(true);
      expect(fn({data: false, operator: 'falsy'})).to.equal(true);
    });
  });
});
