var label = require('./label');

describe('label service', function () {
  it('uses _label string if it exists', function () {
    var name = 'foo-bar',
      schema = { _label: 'Baz' };

    expect(label(name, schema)).to.equal('Baz');
  });

  it('doesn\'t have "Clay " in front of every npm component\'s label', function () {
    var name = 'clay-foo-bar';

    expect(label(name)).to.equal('Foo Bar');
  });

  it('falls back to prettified name if no _label', function () {
    var name = 'foo-bar';

    expect(label(name)).to.equal('Foo Bar');
  });
});
