var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./'),
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
      sandbox.stub(dom, 'pageUri').returns('domain.com/pages/foo');
      sandbox.stub(tpl, 'get');
      fixture.stubAll([
        '.kiln-pane-template',
        '.preview-actions-template',
        '.share-actions-template',
        '.filtered-input-template',
        '.filtered-items-template',
        '.filtered-item-template',
        '.filtered-add-template'
      ], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('close', function () {
      var fn = lib[this.title];

      it('closes an open pane', function () {
        var pane = document.createElement('div');

        pane.classList.add('kiln-toolbar-pane-background');
        document.body.appendChild(pane);
        fn();
        expect(document.querySelector('kiln-toolbar-pane-background')).to.equal(null);
      });

      it('does nothing if no open pane', function () {
        fn();
        expect(document.querySelector('kiln-toolbar-pane-background')).to.equal(null);
      });
    });

    describe('open', function () {
      var fn = lib[this.title];

      it('opens a pane with tabs', function () {
        var header = 'Test Pane',
          innerEl = document.createElement('div');

        // run!
        innerEl.classList.add('test-pane');
        lib.close();
        fn([{header: header, content: innerEl}]);
        expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('Test Pane');
        expect(document.querySelector('#pane-content-1').innerHTML).to.equal('<div class="test-pane"></div>');
      });

      it('opens a pane with a dynamic tab', function () {
        var header = 'Test Pane',
          innerEl = document.createElement('div');

        // run!
        innerEl.classList.add('test-pane');
        lib.close();
        fn([{header: header, content: innerEl}], {header: 'Dynamic!', content: innerEl});
        expect(document.querySelector('#pane-tab-dynamic').innerHTML).to.equal('Dynamic!');
        expect(document.querySelector('#pane-content-dynamic').innerHTML).to.equal('<div class="test-pane"></div>');
      });

      it('opens a pane with a disabled tab', function () {
        var header = 'Test Pane',
          innerEl = document.createElement('div');

        // run!
        innerEl.classList.add('test-pane');
        lib.close();
        fn([{header: header, content: innerEl, disabled: true}]);
        expect(document.querySelector('#pane-tab-1').classList.contains('disabled')).to.equal(true);
      });
    });

    describe('openPreview', function () {
      var fn = lib[this.title],
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
        sandbox.stub(edit);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('opens a preview pane', function () {
        lib.close();
        fn();
        expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('Preview');
        expect(document.querySelector('#pane-tab-2').innerHTML).to.equal('Shareable Link');
        expect(document.querySelectorAll('.pane-inner input').length).to.equal(1);
      });
    });

    describe('openAddComponent', function () {
      var fn = lib[this.title],
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('opens a an add component pane', function () {
        var options = {
          field: { ref: null, path: null}, // parent data, passed to addComponent (we don't care about it here)
          pane: document.createElement('div') // pane element, passed to addComponent (we don't care about it here)
        };

        lib.close();
        fn(['foo'], options);
        expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('Add Component');
        expect(document.querySelectorAll('.pane-inner li.filtered-item').length).to.equal(1);
      });
    });
  });
});
