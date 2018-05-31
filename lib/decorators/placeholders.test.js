import expect from 'expect';
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

    test('throws error if path depth is greater than 2', () => {
      expect(() => fn({}, 'one.two.three')).to.throw(Error);
    });

    test('throws error if top-level field in path is not an array', () => {
      expect(() => fn({ field: 'not an array!' }, 'field.nowhere')).to.throw(Error);
    });

    test('checks complex-list prop emptiness', () => {
      expect(fn({ content: [{ name: '', age: 22 }]}, 'content.name')).to.equal(true);
    });

    test('calls isEmpty on the provided field', () => {
      expect(fn({ name: '' }, 'name' )).to.equal(true);
      expect(fn({ name: 'clay' }, 'name')).to.equal(false);
      expect(fn({ content: [] }, 'content')).to.equal(true);
      expect(fn({ content: [{ text: 'string!' }] }, 'content')).to.equal(false);
    });
  });

  describe('compareFields', () => {
    const fn = lib.compareFields;

    test('throws error if unknown comparator', () => {
      expect(() => fn(['foo', 'NAND', 'bar'], { foo: null, bar: null })).to.throw(Error);
    });

    test('throws error if unmatched fields and comparators', () => {
      expect(() => fn(['foo', 'and', 'bar', 'and'], { foo: null, bar: null })).to.throw(Error);
    });

    test('throws error if mixed comparators', () => {
      expect(() => fn(['foo', 'and', 'bar', 'or', 'baz'], { foo: null, bar: null })).to.throw(Error);
    });

    test('throws error if more than two fields compared with XOR', () => {
      expect(() => fn(['foo', 'xor', 'bar', 'xor', 'baz'], { foo: null, bar: null, baz: null })).to.throw(Error);
    });

    // AND - two fields, multiple fields

    test('AND returns true if both a and b are empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: null, bar: null })).to.equal(true);
    });

    test('AND returns true if all fields are empty', () => {
      expect(fn(['foo', 'and', 'bar', 'and', 'baz'], { foo: null, bar: null, baz: null })).to.equal(true);
    });

    test('AND returns false if either a or b are non-empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: 1, bar: null })).to.equal(false);
    });

    test('AND returns false if any fields are non-empty', () => {
      expect(fn(['foo', 'and', 'bar', 'and', 'baz'], { foo: null, bar: null, baz: 1 })).to.equal(false);
    });

    test('AND returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    test('AND returns false if all fields are non-empty', () => {
      expect(fn(['foo', 'and', 'bar', 'and', 'baz'], { foo: 1, bar: 1, baz: 1 })).to.equal(false);
    });

    // OR - two fields, multiple fields

    test('OR returns true if both a and b are empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: null, bar: null })).to.equal(true);
    });

    test('OR returns true if all fields are empty', () => {
      expect(fn(['foo', 'or', 'bar', 'or', 'baz'], { foo: null, bar: null, baz: null })).to.equal(true);
    });

    test('OR returns true if either a or b are non-empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: 1, bar: null })).to.equal(true);
    });

    test('OR returns true if any fields are non-empty', () => {
      expect(fn(['foo', 'or', 'bar', 'or', 'baz'], { foo: null, bar: null, baz: 1 })).to.equal(true);
    });

    test('OR returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    test('OR returns false if all fields are non-empty', () => {
      expect(fn(['foo', 'or', 'bar', 'or', 'baz'], { foo: 1, bar: 1, baz: 1 })).to.equal(false);
    });

    // XOR - only two fields can logically be compared

    test('XOR returns false if both a and b are empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: null, bar: null })).to.equal(false);
    });

    test('XOR returns true if a is empty and b is non-empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: 1, bar: null })).to.equal(true);
    });

    test('XOR returns true if a is non-empty and b is empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: null, bar: 1 })).to.equal(true);
    });

    test('XOR returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    test('uses case-insensitive comparator', () => {
      expect(fn(['foo', 'AND', 'bar'], { foo: null, bar: null })).to.equal(true);
    });
  });

  describe('isGroupEmpty', () => {
    const fn = lib.isGroupEmpty;

    test('throws error if no ifEmpty property', () => {
      expect(() => fn({}, {}, 'foo')).to.throw('Placeholder for group \'foo\' needs \'ifEmpty\' statement!');
    });

    test('throws error if ifEmpty is not a string', () => {
      expect(() => fn({}, { ifEmpty: 1 }, 'foo')).to.throw('Placeholder for group \'foo\' needs \'ifEmpty\' statement!');
    });

    test('returns true if single empty field', () => {
      expect(fn({ foo: null }, { ifEmpty: 'foo' })).to.equal(true);
    });

    test('returns false if single non-empty field', () => {
      expect(fn({ foo: 1 }, { ifEmpty: 'foo' })).to.equal(false);
    });

    // comparing multiple fields
    // note: we're fully testing compareFields above, so we don't need to go through
    // all the possible combinations and comparators here

    test('returns true if two empty fields', () => {
      expect(fn({ foo: null, bar: null }, { ifEmpty: 'foo and bar' })).to.equal(true);
    });

    test('returns true if more than two empty fields', () => {
      expect(fn({ foo: null, bar: null, baz: null }, { ifEmpty: 'foo and bar and baz' })).to.equal(true);
    });

    test('returns false if two non-empty fields', () => {
      expect(fn({ foo: 1, bar: 1 }, { ifEmpty: 'foo and bar' })).to.equal(false);
    });

    test('returns false if more than two two non-empty fields', () => {
      expect(fn({ foo: 1, bar: 1, baz: 1 }, { ifEmpty: 'foo and bar and baz' })).to.equal(false);
    });
  });

  describe('hasPlaceholder', () => {
    const fn = lib.hasPlaceholder;

    test('returns false if no placeholder property', () => {
      groups.get.returns({ schema: {} });
      expect(fn()).to.equal(false);
    });

    test('returns true if permanent placeholder', () => {
      groups.get.returns({ schema: { [placeholderProp]: { permanent: true } } });
      expect(fn()).to.equal(true);
    });

    test('returns true if single empty field', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [fieldProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    test('returns true if empty group', () => {
      groups.get.returns({ fields: { bar: null }, schema: { fields: ['bar'], [placeholderProp]: { ifEmpty: 'bar' } } });
      expect(fn('foo', 'baz')).to.equal(true);
    });

    test('returns true if empty component list', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [componentListProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    test('returns false if non-empty component list', () => {
      groups.get.returns({ fields: { bar: ['something'] }, schema: { [componentListProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(false);
    });

    test('returns true if empty page-specific component list', () => {
      // note: this may not currently work for component lists in the layout that alias to page areas
      // todo: check this and update if necessary
      groups.get.returns({ fields: { bar: 'bar' }, schema: { [componentListProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar', { state: { page: { data: { bar: [] }}}})).to.equal(true);
    });

    test('returns false if non-empty page-specific component list', () => {
      // note: this may not currently work for component lists in the layout that alias to page areas
      // todo: check this and update if necessary
      groups.get.returns({ fields: { bar: 'bar' }, schema: { [componentListProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar', { state: { page: { data: { bar: ['something'] }}}})).to.equal(false);
    });

    test('returns true if empty component prop', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [componentProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    test('thows error if it encounters something it cannot handle', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [placeholderProp]: true } });
      expect(() => fn('foo', 'bar')).to.throw('Could not determine if I should add a placeholder for bar (in foo)');
    });
  });
});
