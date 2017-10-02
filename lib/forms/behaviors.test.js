import _ from 'lodash';
import * as lib from './behaviors';

// rando object to set behaviors to
// note: in reality, this is a new Vue component
const behavior = { a: 'b' };

describe('behaviors', () => {
  describe('add', () => {
    const fn = lib.add;

    beforeEach(() => {
      // clear out behaviors before each test
      window.kiln.behaviors = {};
    });

    afterEach(() => {
      window.kiln.behaviors = {};
    });

    it('adds behaviors to the global kiln.behaviors object', () => {
      fn('foo', _.assign({}, behavior));
      expect(window.kiln.behaviors.foo).to.eql(behavior);
    });

    it('converts behavior name that matches native tag', () => {
      fn('select', _.assign({}, behavior));
      expect(window.kiln.behaviors.select).to.eql(undefined);
      expect(window.kiln.behaviors['input-select']).to.eql(behavior);
    });

    it('converts behavior name that matches "text"', () => {
      // vue doesn't like using <text> as a component name,
      // even though it doesn't match a native tag name
      fn('text', _.assign({}, behavior));
      expect(window.kiln.behaviors.text).to.eql(undefined);
      expect(window.kiln.behaviors['input-text']).to.eql(behavior);
    });
  });

  describe('expand', () => {
    const fn = lib.expand;

    beforeEach(() => {
      window.kiln.behaviors.foo = _.assign({}, behavior);
      window.kiln.behaviors.bar = _.assign({}, behavior, { slot: 'a' });
      window.kiln.behaviors['input-select'] = _.assign({}, behavior);
    });

    afterEach(() => {
      window.kiln.behaviors = {};
    });

    it('throws error for behaviors it cannot parse', () => {
      expect(() => fn({})).to.throw('Cannot parse behavior: [object Object]');
    });

    it('expands _has: string', () => {
      expect(fn('foo')).to.eql([{ fn: 'foo', args: {}}]);
    });

    it('expands _has: object', () => {
      expect(fn({ fn: 'foo', bar: 'baz' })).to.eql([{ fn: 'foo', args: { bar: 'baz' }}]);
    });

    it('expands _has: array', () => {
      expect(fn([{ fn: 'foo', bar: 'baz' }])).to.eql([{ fn: 'foo', args: { bar: 'baz' }}]);
    });

    it('warns if behavior slot not found in definition', () => {
      fn('foo');
      expect(loggerStub.warn.called).to.equal(true);
    });

    it('adds behavior slot from definition', () => {
      expect(fn('bar')).to.eql([{ fn: 'bar', args: {}, slot: 'a' }]);
    });

    it('omits missing behaviors', () => {
      expect(fn('baz')).to.eql([]);
      expect(loggerStub.warn.called).to.equal(true);
    });

    it('converts behavior names that match native tags', () => {
      expect(fn('select')).to.eql([{ fn: 'input-select', args: {}}]);
    });

    it('converts behaviors name BEFORE omitting', () => {
      expect(fn('textarea')).to.eql([]);
      expect(loggerStub.warn.called).to.equal(true);
    });
  });
});
