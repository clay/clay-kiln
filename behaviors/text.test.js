'use strict';
var fixture = require('../test/fixtures/behavior'),
  text = require('./text');

// set some data
fixture.bindings.data = 'foobar';

describe('text behavior', function () {
  it('has .label-inner', function () {
    expect(text(fixture, {}).el.querySelector('.label-inner')).to.exist;
  });

  it('has input', function () {
    expect(text(fixture, {}).el.querySelector('input')).to.exist;
  });
});