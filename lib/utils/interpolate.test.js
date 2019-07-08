import lib from './interpolate';

describe('interpolate', () => {
  test('interpolates string value', () => {
    expect(lib('${prop}', { prop: 'foo' })).toBe('foo');
  });

  test('interpolates html value', () => {
    expect(lib('${prop}', { prop: '<p>foo</p>' })).toBe('foo');
  });

  test('interpolates number value', () => {
    expect(lib('${prop}', { prop: 123 })).toBe('123');
    expect(lib('${prop}', { prop: 0 })).toBe('0');
  });

  test('interpolates boolean value', () => {
    expect(lib('${prop}', { prop: true })).toBe('true');
    expect(lib('${prop}', { prop: false })).toBe('false');
  });

  test('interpolates regex value', () => {
    expect(lib('${prop}', { prop: /foo/ig })).toBe('/foo/gi');
  });

  test('interpolates array', () => {
    expect(lib('${prop}', { prop: ['foo', 'bar', 'baz'] })).toBe('foo, bar, baz');
  });

  test('interpolates array of objects', () => {
    expect(lib('${prop}', { prop: [{ foo: 'bar' }, { baz: 'qux' }] })).toBe('foo: bar, baz: qux');
  });

  test('recursively interpolates array', () => {
    expect(lib('${prop}', { prop: [{ foo: 'bar' }, { baz: { qux: 'quux' } }] })).toBe('foo: bar, baz: qux: quux');
  });

  test('interpolates object', () => {
    expect(lib('${prop}', { prop: { foo: 'bar' } })).toBe('foo: bar');
  });

  test('recursively interpolates object', () => {
    expect(lib('${prop}', { prop: { foo: 'bar', baz: { qux: 'quux' } } })).toBe('foo: bar, baz: qux: quux');
  });

  test('interpolates falsy values', () => {
    expect(lib('${prop}', { prop: null })).toBe('');
    expect(lib('${prop}', { prop: undefined })).toBe('');
    expect(lib('${prop}', { prop: [] })).toBe('');
    expect(lib('${prop}', { prop: {} })).toBe('');
  });

  test('interpolates data from resolver function', () => {
    expect(lib('${prop}', name => `${name}${name}`)).toBe('propprop');
  });
});
