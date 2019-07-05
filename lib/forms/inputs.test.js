import _ from 'lodash';
import * as lib from './inputs';

// rando object to set inputs to
// note: in reality, this is a new Vue component
const input = { a: 'b' };

describe('inputs', () => {
  describe('add', () => {
    const fn = lib.add;

    beforeEach(() => {
      // clear out inputs before each test
      window.kiln.inputs = {};
    });

    afterEach(() => {
      window.kiln.inputs = {};
    });

    test('adds inputs to the global kiln.inputs object', () => {
      fn('foo', _.assign({}, input));
      expect(window.kiln.inputs.foo).toEqual(input);
    });

    test('converts input name that matches native tag', () => {
      fn('select', _.assign({}, input));
      expect(window.kiln.inputs.select).toBeUndefined();
      expect(window.kiln.inputs['input-select']).toEqual(input);
    });

    test('converts input name that matches "text"', () => {
      // vue doesn't like using <text> as a component name,
      // even though it doesn't match a native tag name
      fn('text', _.assign({}, input));
      expect(window.kiln.inputs.text).toBeUndefined();
      expect(window.kiln.inputs['input-text']).toEqual(input);
    });
  });

  describe('rawExpand', () => {
    const fn = lib.rawExpand;

    test('returns empty object for inputs it cannot parse', () => {
      expect(fn({})).toEqual({});
    });

    test('expands _has: string', () => {
      expect(fn('foo')).toEqual({ input: 'foo' });
    });

    test('expands _has: object', () => {
      expect(fn({ input: 'foo', bar: 'baz' })).toEqual({ input: 'foo', bar: 'baz' });
    });

    test('expands attachedButton', () => {
      expect(fn({ input: 'foo', attachedButton: 'baz' })).toEqual({ input: 'foo', attachedButton: { name: 'baz' } });
    });
  });

  describe('expand', () => {
    const fn = lib.expand;

    beforeEach(() => {
      window.kiln.inputs.foo = _.assign({}, input);
      window.kiln.inputs.bar = _.assign({}, input);
      window.kiln.inputs['input-select'] = _.assign({}, input);
    });

    afterEach(() => {
      window.kiln.inputs = {};
    });

    test('omits missing input', () => {
      expect(fn('baz')).toEqual({});
      expect(mockLogger).toHaveBeenCalledWith('warn', 'Input "baz" not found. Make sure you add it!', { action: 'omitMissingInput', input: { input: 'baz' } });
    });

    test('converts input names that match native tags', () => {
      expect(fn('select')).toEqual({ input: 'input-select' });
    });

    test('does NOT convert input names that do not match native tags', () => {
      expect(fn('foo')).toEqual({ input: 'foo' });
    });

    test('converts inputs name BEFORE omitting', () => {
      expect(fn('textarea')).toEqual({});
      expect(mockLogger).toHaveBeenCalledWith('warn', 'Input "input-textarea" not found. Make sure you add it!', { action: 'omitMissingInput', input: { input: 'input-textarea' } });
    });
  });
});
