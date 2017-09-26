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

    it('adds inputs to the global kiln.inputs object', () => {
      fn('foo', _.assign({}, input));
      expect(window.kiln.inputs.foo).to.eql(input);
    });

    it('converts input name that matches native tag', () => {
      fn('select', _.assign({}, input));
      expect(window.kiln.inputs.select).to.eql(undefined);
      expect(window.kiln.inputs['input-select']).to.eql(input);
    });

    it('converts input name that matches "text"', () => {
      // vue doesn't like using <text> as a component name,
      // even though it doesn't match a native tag name
      fn('text', _.assign({}, input));
      expect(window.kiln.inputs.text).to.eql(undefined);
      expect(window.kiln.inputs['input-text']).to.eql(input);
    });
  });

  describe('rawExpand', () => {
    const fn = lib.rawExpand;

    it('returns empty object for inputs it cannot parse', () => {
      expect(fn({})).to.eql({});
    });

    it('expands _has: string', () => {
      expect(fn('foo')).to.eql({ input: 'foo' });
    });

    it('expands _has: object', () => {
      expect(fn({ input: 'foo', bar: 'baz' })).to.eql({ input: 'foo', bar: 'baz' });
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

    it('omits missing input', () => {
      expect(fn('baz')).to.eql({});
      expect(console.warn).to.have.been.calledWith('Input "baz" not found. Make sure you add it!');
    });

    it('converts input names that match native tags', () => {
      expect(fn('select')).to.eql(input);
    });

    it('converts inputs name BEFORE omitting', () => {
      expect(fn('textarea')).to.eql({});
      expect(console.warn).to.have.been.calledWith('Input "input-textarea" not found. Make sure you add it!');
    });
  });
});
