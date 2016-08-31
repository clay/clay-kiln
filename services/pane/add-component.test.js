var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  pane = require('./'),
  lib = require('./add-component'),
  dom = require('@nymag/dom'),
  tpl = require('../tpl'),
  fixture = require('../../test/fixtures/tpl');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      var toolbar = dom.create('<div class="kiln-toolbar"></div>');

      document.body.appendChild(toolbar);
      sandbox = sinon.sandbox.create();
      sandbox.stub(tpl, 'get');
      fixture.stubAll([
        '.kiln-pane-template',
        '.filtered-input-template',
        '.filtered-items-template',
        '.filtered-item-template',
        '.filtered-add-template'
      ], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('opens an add component pane', function () {
      var options = {
        field: { ref: null, path: null}, // parent data, passed to addComponent (we don't care about it here)
        pane: document.createElement('div') // pane element, passed to addComponent (we don't care about it here)
      };

      pane.close();
      lib(['foo'], options);
      expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('Add Component');
      expect(document.querySelectorAll('.pane-inner li.filtered-item').length).to.equal(1);
    });

    it('adds a button to view all components when passed isFuzzy', function () {
      var options = {
        field: { ref: null, path: null}, // parent data, passed to addComponent (we don't care about it here)
        pane: document.createElement('div'), // pane element, passed to addComponent (we don't care about it here)
        isFuzzy: true
      };

      pane.close();
      lib(['foo'], options);
      expect(document.querySelector('.filtered-add-title').innerHTML).to.equal('View all components');
    });
  });
});
