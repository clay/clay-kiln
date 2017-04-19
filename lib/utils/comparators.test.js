import * as lib from './comparators';

describe('comparators', () => {
  describe('isEmpty', () => {
    const fn = lib.isEmpty;

    it('returns false if non-empty string', () => expect(fn('hi')).to.equal(false));
    it('returns false if any number', () => expect(fn(0)).to.equal(false));
    it('returns false if any boolean', () => expect(fn(false)).to.equal(false));
    it('returns true if empty string', () => expect(fn('')).to.equal(true));
    it('returns true if null', () => expect(fn(null)).to.equal(true));
    it('returns true if undefined', () => expect(fn('')).to.equal(true));
    it('returns true if empty array', () => expect(fn([])).to.equal(true));
    it('returns true if empty object', () => expect(fn({})).to.equal(true));
  });

  describe('compare', () => {
    const fn = lib.compare;

    it('throws error if unknown operator', () => expect(() => fn({ operator: 'asdf' })).to.throw(Error));

    it('defaults to checking if field has value', () => {
      expect(fn({data: 'hi'})).to.equal(true);
      expect(fn({data: ''})).to.equal(false);
    });

    it('defaults to using the equal operator', () => {
      expect(fn({data: 1, value: 1})).to.equal(true);
      expect(fn({data: 1, value: 0})).to.equal(false);
    });

    it('compares equality', () => {
      expect(fn({data: 1, operator: '===', value: 1})).to.equal(true);
      expect(fn({data: 1, operator: '!==', value: 0})).to.equal(true);
    });

    it('compares range', () => {
      expect(fn({data: 1, operator: '<', value: 2})).to.equal(true);
      expect(fn({data: 1, operator: '>', value: 0})).to.equal(true);
      expect(fn({data: 1, operator: '<=', value: 1})).to.equal(true);
      expect(fn({data: 1, operator: '>=', value: 1})).to.equal(true);
    });

    it('compares typeof', () => expect(fn({data: 'hi', operator: 'typeof', value: 'string'})).to.equal(true));

    it('compares regex', () => {
      expect(fn({data: 'hello', operator: 'regex', value: '^hel'})).to.equal(true);
      expect(fn({data: 'hello', operator: 'regex', value: '^hi'})).to.equal(false);
    });

    it('compares field emptiness', () => {
      expect(fn({data: [], operator: 'empty'})).to.equal(true);
      expect(fn({data: false, operator: 'not-empty'})).to.equal(true);
    });

    it('compares field truthiness', () => {
      expect(fn({data: [], operator: 'truthy'})).to.equal(true);
      expect(fn({data: false, operator: 'falsy'})).to.equal(true);
    });
  });
});
