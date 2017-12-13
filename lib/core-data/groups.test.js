import * as lib from './groups';
import * as components from './components';

const foo = 'foo',
  bar = 'bar',
  general = (fields) => {
    return {
      title: 'General',
      fields
    };
  };

describe('groups', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(components);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('expandFields', () => {
    const fn = lib.expandFields;

    it('throws error if not array', () => {
      expect(() => fn('foo')).to.throw(Error);
    });

    it('returns null if field does not exist in data', () => {
      const fields = ['foo', 'bar'],
        data = { foo };

      expect(fn(fields, data)).to.eql({ foo, bar: null });
    });

    it('expands fields', () => {
      const fields = ['foo'],
        data = { foo, bar };

      expect(fn(fields, data)).to.eql({foo});
    });
  });

  describe('parseSections', () => {
    const fn = lib.parseSections;

    it('returns empty fields and sections if no fields', () => {
      expect(fn([])).to.eql({ fields: [], sections: [] });
    });

    it('returns General if no section title specified', () => {
      expect(fn(['foo', 'bar'])).to.eql({
        fields: ['foo', 'bar'],
        sections: [{
          title: 'General',
          fields: ['foo', 'bar']
        }]
      });
    });

    it('parses section titles', () => {
      expect(fn(['foo (One)', 'bar(One)'])).to.eql({
        fields: ['foo', 'bar'],
        sections: [{
          title: 'One',
          fields: ['foo', 'bar']
        }]
      });
    });

    it('throws error if it cannot parse field', () => {
      expect(() => fn(['foo! bar!'])).to.throw(Error);
    });

    it('throws error if it cannot parse section', () => {
      expect(() => fn([' (foo)'])).to.throw(Error);
    });

    it('returns fields and sections in order', () => {
      expect(fn([
        'foo (One)',
        'bar (Two)',
        'baz (One)',
        'qux'
      ])).to.eql({
        fields: ['foo', 'bar', 'baz', 'qux'],
        sections: [{
          title: 'One',
          fields: ['foo', 'baz']
        }, {
          title: 'Two',
          fields: ['bar']
        }, {
          title: 'General',
          fields: ['qux']
        }]
      });
    });
  });

  describe('get', () => {
    const fn = lib.get;

    it('throws error if field not found in schema', () => {
      components.getData.returns({ bar });
      components.getSchema.returns({});
      expect(() => fn('foo', 'bar')).to.throw(Error);
    });

    it('returns undefined if field not found in data', () => {
      components.getData.returns({});
      components.getSchema.returns({ bar: {} });
      expect(fn('foo', 'bar')).to.eql({ fields: { bar: undefined }, schema: {}});
    });

    it('returns a single field', () => {
      components.getData.returns({ bar });
      components.getSchema.returns({ bar: { _has: 'text' } });
      expect(fn('foo', 'bar')).to.eql({ fields: { bar }, schema: { _has: 'text' }});
    });

    it('returns fields for a group', () => {
      const baz = {
        fields: ['foo', 'bar'],
        sections: [general(['foo', 'bar'])],
        _label: 'Baz'
      };

      components.getData.returns({ foo, bar });
      components.getSchema.returns({
        foo: {},
        bar: {},
        _groups: {
          baz
        }
      });
      expect(fn('foo', 'baz')).to.eql({ fields: { foo, bar }, schema: baz });
    });

    it('returns settings group with label', () => {
      const baz = {
        fields: ['foo', 'bar'],
        sections: [general(['foo', 'bar'])],
        _placeholder: true // this should be merged into the resulting schema
      };

      components.getData.returns({ foo, bar });
      components.getSchema.returns({
        foo: {},
        bar: {},
        _groups: {
          settings: baz
        }
      });
      expect(fn('/components/foo', 'settings')).to.eql({ fields: {foo, bar}, schema: {
        fields: ['foo', 'bar'],
        sections: [general(['foo', 'bar'])],
        _label: 'Foo Settings',
        _placeholder: true
      } });
    });
  });
});
