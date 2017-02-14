import lib from './interpolate';

describe('interpolate', () => {
  it('interpolates string value', () => {
    expect(lib('${prop}', { prop: 'foo' })).to.equal('foo');
  });

  it('interpolates number value', () => {
    expect(lib('${prop}', { prop: 123 })).to.equal('123');
    expect(lib('${prop}', { prop: 0 })).to.equal('0');
  });

  it('interpolates boolean value', () => {
    expect(lib('${prop}', { prop: true })).to.equal('true');
    expect(lib('${prop}', { prop: false })).to.equal('false');
  });

  it('interpolates array', () => {
    expect(lib('${prop}', { prop: ['foo', 'bar', 'baz'] })).to.equal('foo, bar, baz');
  });

  it('interpolates array of objects', () => {
    expect(lib('${prop}', { prop: [{ foo: 'bar' }, { baz: 'qux' }] })).to.equal('foo: bar, baz: qux');
  });

  it('recursively interpolates array', () => {
    expect(lib('${prop}', { prop: [{ foo: 'bar' }, { baz: { qux: 'quux' } }] })).to.equal('foo: bar, baz: qux: quux');
  });

  it('interpolates object', () => {
    expect(lib('${prop}', { prop: { foo: 'bar' } })).to.equal('foo: bar');
  });

  it('recursively interpolates object', () => {
    expect(lib('${prop}', { prop: { foo: 'bar', baz: { qux: 'quux' } } })).to.equal('foo: bar, baz: qux: quux');
  });

  it('interpolates falsy values', () => {
    expect(lib('${prop}', { prop: null })).to.equal('');
    expect(lib('${prop}', { prop: undefined })).to.equal('');
    expect(lib('${prop}', { prop: [] })).to.equal('');
    expect(lib('${prop}', { prop: {} })).to.equal('');
  });
});
