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

jest.mock('./components');

describe('groups', () => {
  describe('expandFields', () => {
    const fn = lib.expandFields;

    test('throws error if not array', () => {
      expect(() => fn('foo')).toThrow(Error);
    });

    test('returns null if field does not exist in data', () => {
      const fields = ['foo', 'bar'],
        data = { foo };

      expect(fn(fields, data)).toEqual({ foo, bar: null });
    });

    test('expands fields', () => {
      const fields = ['foo'],
        data = { foo, bar };

      expect(fn(fields, data)).toEqual({ foo });
    });
  });

  describe('parseSections', () => {
    const fn = lib.parseSections;

    test('returns empty fields and sections if no fields', () => {
      expect(fn([])).toEqual({ fields: [], sections: [] });
    });

    test('returns General if no section title specified', () => {
      expect(fn(['foo', 'bar'])).toEqual({
        fields: ['foo', 'bar'],
        sections: [{
          title: 'General',
          fields: ['foo', 'bar']
        }]
      });
    });

    test('parses section titles', () => {
      expect(fn(['foo (One)', 'bar(One)'])).toEqual({
        fields: ['foo', 'bar'],
        sections: [{
          title: 'One',
          fields: ['foo', 'bar']
        }]
      });
    });

    test('throws error if it cannot parse field', () => {
      expect(() => fn(['foo! bar!'])).toThrow(Error);
    });

    test('throws error if it cannot parse section', () => {
      expect(() => fn([' (foo)'])).toThrow(Error);
    });

    test('returns fields and sections in order', () => {
      expect(fn([
        'foo (One)',
        'bar (Two)',
        'baz (One)',
        'qux'
      ])).toEqual({
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

    test('throws error if field not found in schema', () => {
      components.getData.mockReturnValueOnce({ bar });
      components.getData.mockReturnValueOnce(bar);
      components.getSchema.mockReturnValueOnce({});
      components.getSchema.mockReturnValueOnce(undefined);
      expect(fn('foo', 'bar')).toBeNull();
    });

    test('returns undefined if field not found in data', () => {
      components.getData.mockReturnValueOnce({});
      components.getData.mockReturnValueOnce(undefined);
      components.getSchema.mockReturnValueOnce({ bar: { _has: 'text' } });
      components.getSchema.mockReturnValueOnce({ _has: 'text' });
      expect(fn('foo', 'bar')).toEqual({ fields: { bar: undefined }, schema: { _has: 'text' } });
    });

    test('returns a single field', () => {
      components.getData.mockReturnValueOnce({ bar });
      components.getData.mockReturnValueOnce(bar);
      components.getSchema.mockReturnValueOnce({ bar: { _has: 'text' } });
      components.getSchema.mockReturnValueOnce({ _has: 'text' });
      expect(fn('foo', 'bar')).toEqual({ fields: { bar }, schema: { _has: 'text' } });
    });

    test('returns a deep field inside a complex-list', () => {
      components.getData.mockReturnValueOnce({ content: [{ bar: 'bar' }] });
      components.getData.mockReturnValueOnce('bar');
      components.getSchema.mockReturnValueOnce({ content: { _has: { props: [{ prop: 'bar', _has: 'text' }] } } });
      components.getSchema.mockReturnValueOnce({
        prop: 'bar',
        _has: 'text'
      });
      expect(fn('foo', 'content.0.bar')).toEqual({ fields: { 'content.0.bar': 'bar' }, schema: { prop: 'bar', _has: 'text' } });
    });

    test('returns fields for a group', () => {
      const baz = {
        fields: ['foo', 'bar'],
        sections: [general(['foo', 'bar'])],
        _label: 'Baz'
      };

      components.getData.mockReturnValueOnce({ foo, bar });
      components.getData.mockReturnValueOnce(undefined);
      components.getSchema.mockReturnValueOnce({
        foo: {},
        bar: {},
        _groups: {
          baz
        }
      });
      components.getSchema.mockReturnValueOnce(undefined);
      expect(fn('foo', 'baz')).toEqual({ fields: { foo, bar }, schema: baz });
    });

    test('returns settings group with label', () => {
      const baz = {
        fields: ['foo', 'bar'],
        sections: [general(['foo', 'bar'])],
        _placeholder: true // this should be merged into the resulting schema
      };

      components.getData.mockReturnValueOnce({ foo, bar });
      components.getData.mockReturnValueOnce(undefined);
      components.getSchema.mockReturnValueOnce({
        foo: {},
        bar: {},
        _groups: {
          settings: baz
        }
      });
      components.getSchema.mockReturnValueOnce(undefined);
      expect(fn('/_components/foo', 'settings')).toEqual({
        fields: { foo, bar },
        schema: {
          fields: ['foo', 'bar'],
          sections: [general(['foo', 'bar'])],
          _label: 'Foo Settings',
          _placeholder: true
        }
      });
    });
  });

  describe('has', () => {
    const fn = lib.has;

    test('returns false if field not found in schema', () => {
      components.getData.mockReturnValueOnce({ bar });
      components.getData.mockReturnValueOnce(bar);
      components.getSchema.mockReturnValueOnce({});
      components.getData.mockReturnValueOnce(undefined);
      expect(fn('foo', 'bar')).toBe(false);
    });

    test('returns true if field not found in data', () => {
      components.getData.mockReturnValue({});
      components.getSchema.mockReturnValue({ bar: {} });
      expect(fn('foo', 'bar')).toBe(true);
    });

    test('returns true for a single field', () => {
      components.getData.mockReturnValue({ bar });
      components.getSchema.mockReturnValue({ bar: { _has: 'text' } });
      expect(fn('foo', 'bar')).toBe(true);
    });

    test('returns true for a group', () => {
      const baz = {
        fields: ['foo', 'bar'],
        sections: [general(['foo', 'bar'])],
        _placeholder: true // this should be merged into the resulting schema
      };

      components.getData.mockReturnValue({ foo, bar });
      components.getSchema.mockReturnValue({
        foo: {},
        bar: {},
        _groups: {
          settings: baz
        }
      });
      expect(fn('foo', 'settings')).toBe(true);
    });
  });
});
