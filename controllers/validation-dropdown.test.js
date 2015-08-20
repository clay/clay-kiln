var dom = require('../services/dom'),
  lib = require('./validation-dropdown'),
  site = require('../services/site'),
  sinon = require('sinon');

describe('validation-dropdown controller', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(site);
    site.get.withArgs('prefix').returns('place.com');
    site.addPort.returnsArg(0);
    site.addProtocol.returnsArg(0);
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('updates', function () {
    var containerEl = dom.create('<div></div>'),
      instance;

    expect(function () {
      instance = new lib(containerEl, []);
      instance.update([]);
    }).to.not.throw();
  });

  it('removes', function () {
    var containerEl = dom.create('<div></div>'),
      instance;

    expect(function () {
      instance = new lib(containerEl, []);
      instance.remove();
    }).to.not.throw();
  });

  it('closes', function () {
    var containerEl = dom.create('<div></div>'),
      instance;

    expect(function () {
      instance = new lib(containerEl, []);
      instance.onClose();
    }).to.not.throw();
  });
});
