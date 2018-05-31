import expect from 'expect';
import lib from './label';

describe('label', () => {
  test('uses _label string if it exists', () => {
    expect(lib('foo-bar', { _label: 'Baz' })).to.equal('Baz');
  });

  test('removes "clay-" from name', () => {
    expect(lib('clay-foo-bar')).to.equal('Foo Bar');
  });

  test('uses name if no _label in schema', () => {
    expect(lib('foo-bar')).to.equal('Foo Bar');
  });
});
