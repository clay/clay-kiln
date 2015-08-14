var lib = require('./control'),
  expect = require('chai').expect,
  sinon = require('sinon');

describe('control service', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('setReadOnly', function () {
    var fn = lib[this.title];

    it('takes null', function () {
      var data = null;

      expect(fn(data)).to.equal(data);
    });

    it('takes empty object', function () {
      var data = {};

      expect(fn(data)).to.equal(data);
    });
  });
});