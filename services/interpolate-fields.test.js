var lib = require('./interpolate-fields');

describe('field interpolation service', function () {
  it('interpolates string value', function () {
    expect(lib('${prop}', { prop: { value: 'foo' }})).to.equal('foo');
  });

  it('interpolates number value', function () {
    expect(lib('${prop}', { prop: { value: 123 }})).to.equal('123');
    expect(lib('${prop}', { prop: { value: 0 }})).to.equal('0');
  });

  it('interpolates boolean value', function () {
    expect(lib('${prop}', { prop: { value: true }})).to.equal('true');
    expect(lib('${prop}', { prop: { value: false }})).to.equal('false');
  });

  it('interpolates array', function () {
    expect(lib('${prop}', { prop: ['foo', 'bar', 'baz'] })).to.equal('foo, bar, baz');
  });

  it('interpolates falsy values', function () {
    expect(lib('${prop}', { prop: { value: null }})).to.equal('');
    expect(lib('${prop}', { prop: { value: undefined }})).to.equal('');
    expect(lib('${prop}', { prop: [] })).to.equal('');
    expect(lib('${prop}', { prop: null })).to.equal('');
    expect(lib('${prop}', { prop: {} })).to.equal(''); // no value
    expect(lib('${prop}', { prop: undefined })).to.equal('');
  });

  it('does NOT interpolate array of objects', function () {
    expect(lib('${prop}', { prop: [{}, {}, {}] })).to.equal('');
  });

  it('does NOT interpolate object', function () {
    expect(lib('${prop}', { prop: {} })).to.equal('');
  });
});
