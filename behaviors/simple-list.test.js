var fixture = require('../test/fixtures/behavior'),
  simpleList = require('./simple-list');

// set some data
fixture.bindings.data = [{
  text: 'foo'
}];

describe('simpleList behavior', function () {
  it('has .simple-list-item', function () {
    expect(simpleList(fixture, {}).el.querySelector('.simple-list-item')).to.not.equal(undefined);
  });
});
