var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./preview'),
  pane = require('./'),
  dom = require('@nymag/dom'),
  tpl = require('../tpl'),
  edit = require('../edit'),
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
      sandbox.stub(edit);
      edit.getPageUrl.returns('http://domain.com/pages/foo.html');
      fixture.stubAll([
        '.kiln-pane-template',
        '.preview-actions-template',
        '.share-actions-template'
      ], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('opens a preview pane', function () {
      pane.close();
      lib();
      expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('Preview');
      expect(document.querySelector('#pane-tab-2').innerHTML).to.equal('Shareable Link');
      expect(document.querySelectorAll('.pane-inner input').length).to.equal(1);
    });

    it('generates shareable link', function () {
      pane.close();
      lib();
      expect(document.querySelector('.share-input').value).to.equal('http://domain.com/pages/foo.html');
    });
  });
});
