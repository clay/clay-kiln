import lib from './label';

describe('label', () => {
  it('uses _label string if it exists', () => {
    expect(lib('foo-bar', { _label: 'Baz' })).to.equal('Baz');
  });

  it('removes "clay-" from name', () => {
    expect(lib('clay-foo-bar')).to.equal('Foo Bar');
  });

  it('uses name if no _label in schema', () => {
    expect(lib('foo-bar')).to.equal('Foo Bar');
  });
});
