var fixture = require('../test/fixtures/behavior'),
  text = require('./text');

// set some data
fixture.bindings.foo.data = 'foobar';

describe('text behavior', function () {
  it('has input', function () {
    expect(text(fixture, {}).el.querySelector('input')).to.not.equal(undefined);
  });
});
