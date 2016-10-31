var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  pane = require('./'),
  lib = require('./clay-menu'),
  tpl = require('../tpl'),
  ds = require('dollar-slice'),
  fixture = require('../../test/fixtures/tpl');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      var toolbar = dom.create('<div class="kiln-toolbar"></div>');

      document.body.appendChild(toolbar);
      sandbox = sinon.sandbox.create();
      sandbox.stub(tpl, 'get');
      sandbox.stub(ds);
      fixture.stubAll([
        '.kiln-pane-template',
        '.settings-tab-template'
      ], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('opens a clay menu pane', function () {
      state.get.returns(Promise.resolve({}));
      pane.close();

      function expectRegularPane() {
        expect(document.querySelector('#pane-tab-dynamic').innerHTML).to.equal('Settings');
      }

      lib().then(expectRegularPane);
    });
  });
});
