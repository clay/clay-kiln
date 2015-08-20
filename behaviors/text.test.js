var fixture = require('../test/fixtures/behavior')({ value: 'foobar' }),
  text = require('./text');

describe('text behavior', function () {
  it('has input', function () {
    expect(text(fixture, {}).el.querySelector('input')).to.not.equal(undefined);
  });
});
