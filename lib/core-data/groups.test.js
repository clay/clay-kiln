import * as lib from './groups';
import * as components from './components';

const foo = { value: 'foo' },
  bar = { value: 'bar' };

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

    it('throws error if field does not exist in data', () => {
      const fields = ['foo', 'bar'],
        data = { foo: {} };

      expect(() => fn(fields, data)).to.throw(Error);
    });

    it('expands fields', () => {
      const fields = ['foo'],
        data = { foo, bar };

      expect(fn(fields, data)).to.eql({foo});
    });
  });

  describe('getSettingsFields', () => {
    const fn = lib.getSettingsFields;

    it('returns empty objext if no fields', () => {
      expect(fn({}, {})).to.eql({});
    });

    it('returns empty objext if no settings fields', () => {
      expect(fn({ foo }, { foo: { _display: 'overlay' }})).to.eql({});
    });

    it('returns object of settings fields', () => {
      expect(fn({ foo }, { foo: { _display: 'settings' }})).to.eql({foo});
    });

    it('favors manual settings group', () => {
      expect(fn({ foo, bar }, {
        foo: { _display: 'overlay' },
        bar: { _display: 'settings' }, // if it was going by _display, only bar would be included
        _groups: {
          settings: {
            fields: ['bar', 'foo'] // note, order is different than the property order
          }
        }
      })).to.eql({bar, foo});
    });
  });

  describe('get', () => {
    const fn = lib.get;

    it('throws error if field not found in data', () => {
      components.getData.returns({});
      components.getSchema.returns({ bar: {} });
      expect(() => fn('foo', 'bar')).to.throw(Error);
    });

    it('throws error if field not found in schema', () => {
      components.getData.returns({ bar });
      components.getSchema.returns({});
      expect(() => fn('foo', 'bar')).to.throw(Error);
    });

    it('returns a single field', () => {
      components.getData.returns({ bar });
      components.getSchema.returns({ bar: { _display: 'overlay' } });
      expect(fn('foo', 'bar')).to.eql({ fields: { bar }, _schema: { _display: 'overlay' }});
    });

    it('returns fields for a group', () => {
      const baz = {
        fields: ['foo', 'bar']
      };

      components.getData.returns({ foo, bar });
      components.getSchema.returns({
        foo: {},
        bar: {},
        _groups: {
          baz
        }
      });
      expect(fn('foo', 'baz')).to.eql({ fields: {foo, bar}, _schema: baz });
    });

    it('returns manual settings group when passed settings path', () => {
      const baz = {
        fields: ['foo', 'bar']
      };

      components.getData.returns({ foo, bar });
      components.getSchema.returns({
        foo: {},
        bar: {},
        _groups: {
          settings: baz
        }
      });
      expect(fn('/components/foo', 'settings')).to.eql({ fields: {foo, bar}, _schema: {
        fields: ['foo', 'bar'],
        _display: 'settings',
        _label: 'Foo Settings'
      } });
    });

    it('returns settings fields when passed settings path', () => {
      components.getData.returns({ foo, bar });
      components.getSchema.returns({
        foo: { _display: 'settings' },
        bar: {}
      });
      expect(fn('/components/foo', 'settings')).to.eql({ fields: {foo}, _schema: {
        fields: ['foo'],
        _display: 'settings',
        _label: 'Foo Settings'
      } });
    });
  });
});
