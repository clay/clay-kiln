import * as lib from './placeholders';
import * as groups from '../core-data/groups';
import { placeholderProp, fieldProp, componentListProp, componentProp } from '../utils/references';

describe('placeholders', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(groups);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isFieldEmpty', () => {
    const fn = lib.isFieldEmpty;

    it('is false if boolean', () => {
      expect(fn(true)).to.equal(false);
      expect(fn(false)).to.equal(false);
    });

    it('is false if number', () => {
      expect(fn(1)).to.equal(false);
      expect(fn(0)).to.equal(false);
    });

    it('is false if non-empty string', () => {
      expect(fn('hello')).to.equal(false);
    });

    it('is false if non-empty array', () => {
      expect(fn([0])).to.equal(false);
    });

    it('is false if non-empty object', () => {
      expect(fn({ foo: false })).to.equal(false);
    });

    it('is true if undefined', () => {
      expect(fn()).to.equal(true);
    });

    it('is true if null', () => {
      expect(fn(null)).to.equal(true);
    });

    it('is true if empty string', () => {
      expect(fn('')).to.equal(true);
    });

    it('is true if empty array', () => {
      expect(fn([])).to.equal(true);
    });

    it('is true if empty object', () => {
      expect(fn({})).to.equal(true);
    });

    it('is true if array with empty objects', () => {
      expect(fn([{}])).to.equal(true);
    });

    it('is true if array with objects whose props are considered empty', () => {
      expect(fn([{ foo: '' }])).to.equal(true);
    });
  });

  describe('compareTwoFields', () => {
    const fn = lib.compareTwoFields;

    it('throws error if unknown comparator', () => {
      expect(() => fn(['foo', 'NAND', 'bar'], { foo: null, bar: null })).to.throw(Error);
    });

    it('AND returns true if both a and b are empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: null, bar: null })).to.equal(true);
    });

    it('AND returns false if either a or b are non-empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: 1, bar: null })).to.equal(false);
    });

    it('AND returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    it('OR returns true if both a and b are empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: null, bar: null })).to.equal(true);
    });

    it('OR returns true if either a or b are non-empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: 1, bar: null })).to.equal(true);
    });

    it('OR returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    it('XOR returns false if both a and b are empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: null, bar: null })).to.equal(false);
    });

    it('XOR returns true if a is empty and b is non-empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: 1, bar: null })).to.equal(true);
    });

    it('XOR returns true if a is non-empty and b is empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: null, bar: 1 })).to.equal(true);
    });

    it('XOR returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    it('uses case-insensitive comparator', () => {
      expect(fn(['foo', 'AND', 'bar'], { foo: null, bar: null })).to.equal(true);
    });
  });

  describe('isGroupEmpty', () => {
    const fn = lib.isGroupEmpty;

    it('throws error if no ifEmpty property', () => {
      expect(() => fn({}, {}, 'foo')).to.throw('Placeholder for group \'foo\' needs \'ifEmpty\' statement!');
    });

    it('throws error if ifEmpty is not a string', () => {
      expect(() => fn({}, { ifEmpty: 1 }, 'foo')).to.throw('Placeholder for group \'foo\' needs \'ifEmpty\' statement!');
    });

    it('returns true if single empty field', () => {
      expect(fn({ foo: null }, { ifEmpty: 'foo' })).to.equal(true);
    });

    it('returns false if single non-empty field', () => {
      expect(fn({ foo: 1 }, { ifEmpty: 'foo' })).to.equal(false);
    });

    it('returns true if two empty fields', () => {
      expect(fn({ foo: null, bar: null }, { ifEmpty: 'foo and bar' })).to.equal(true);
    });

    it('returns false if two non-empty fields', () => {
      // note: we're fully testing compareTwoFields above, so we don't need to go through
      // all the possible combinations and comparators here
      expect(fn({ foo: 1, bar: 1 }, { ifEmpty: 'foo and bar' })).to.equal(false);
    });

    it('throws error if more than two fields', () => {
      expect(() => fn({}, { ifEmpty: 'foo and bar and baz' }, 'foo')).to.throw('Too many arguments in \'ifEmpty\' statement! (foo and bar and baz)');
    });
  });

  describe('hasPlaceholder', () => {
    const fn = lib.hasPlaceholder;

    it('returns false if no placeholder property', () => {
      groups.get.returns({ schema: {} });
      expect(fn()).to.equal(false);
    });

    it('returns true if permanent placeholder', () => {
      groups.get.returns({ schema: { [placeholderProp]: { permanent: true } } });
      expect(fn()).to.equal(true);
    });

    it('returns true if single empty field', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [fieldProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    it('returns true if empty group', () => {
      groups.get.returns({ fields: { bar: null }, schema: { fields: ['bar'], [placeholderProp]: { ifEmpty: 'bar' } } });
      expect(fn('foo', 'baz')).to.equal(true);
    });

    it('returns true if empty component list', () => {
      // note: this may not currently work for component lists in the layout that alias to page areas
      // todo: check this and update if necessary
      groups.get.returns({ fields: { bar: null }, schema: { [componentListProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    it('returns true if empty component prop', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [componentProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    it('thows error if it encounters something it cannot handle', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [placeholderProp]: true } });
      expect(() => fn('foo', 'bar')).to.throw('Could not determine if I should add a placeholder for bar (in foo)');
    });
  });
});
