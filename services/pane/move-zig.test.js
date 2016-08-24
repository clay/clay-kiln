var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./move-zig'),
  pane = require('./'),
  site = require('../site'),
  tpl = require('../tpl'),
  fixture = require('../../test/fixtures/tpl');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(site, 'get').returns('/foo');
      sandbox.stub(tpl, 'get');
      fixture.stubAll(['.kiln-pane-template'], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('has no chance to survive make your time', function () {
      pane.close();
      lib();
      expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('<span class="ayb-header">HOW ARE YOU GENTLEMEN <em>!!</em></span>');
    });
  });
});
