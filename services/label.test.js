var label = require('./label');

describe('label service', function () {
  var name = 'foo.bar';

  it('uses _label string if it exists', function () {
    var schema = { _label: 'Baz' };

    expect(label(name, schema)).to.equal('Baz');
  });

  it('falls back to prettified name if no _label', function () {
    expect(label(name)).to.equal('Foo » Bar');
  });
});
