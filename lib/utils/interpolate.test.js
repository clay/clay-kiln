import expect from 'expect';
import lib from './interpolate';

describe('interpolate', () => {
  test('interpolates string value', () => {
    expect(lib('${prop}', { prop: 'foo' })).to.equal('foo');
  });

  test('interpolates html value', () => {
    expect(lib('${prop}', { prop: '<p>foo</p>' })).to.equal('foo');
  });

  test('interpolates number value', () => {
    expect(lib('${prop}', { prop: 123 })).to.equal('123');
    expect(lib('${prop}', { prop: 0 })).to.equal('0');
  });

  test('interpolates boolean value', () => {
    expect(lib('${prop}', { prop: true })).to.equal('true');
    expect(lib('${prop}', { prop: false })).to.equal('false');
  });

  test('interpolates regex value', () => {
    expect(lib('${prop}', { prop: /foo/ig })).to.equal('/foo/gi');
  });

  test('interpolates array', () => {
    expect(lib('${prop}', { prop: ['foo', 'bar', 'baz'] })).to.equal('foo, bar, baz');
  });

  test('interpolates array of objects', () => {
    expect(lib('${prop}', { prop: [{ foo: 'bar' }, { baz: 'qux' }] })).to.equal('foo: bar, baz: qux');
  });

  test('recursively interpolates array', () => {
    expect(lib('${prop}', { prop: [{ foo: 'bar' }, { baz: { qux: 'quux' } }] })).to.equal('foo: bar, baz: qux: quux');
  });

  test('interpolates object', () => {
    expect(lib('${prop}', { prop: { foo: 'bar' } })).to.equal('foo: bar');
  });

  test('recursively interpolates object', () => {
    expect(lib('${prop}', { prop: { foo: 'bar', baz: { qux: 'quux' } } })).to.equal('foo: bar, baz: qux: quux');
  });

  test('interpolates falsy values', () => {
    expect(lib('${prop}', { prop: null })).to.equal('');
    expect(lib('${prop}', { prop: undefined })).to.equal('');
    expect(lib('${prop}', { prop: [] })).to.equal('');
    expect(lib('${prop}', { prop: {} })).to.equal('');
  });

  test('interpolates data from resolver function', () => {
    expect(lib('${prop}', (name) => `${name}${name}`)).to.equal('propprop');
  });
});
