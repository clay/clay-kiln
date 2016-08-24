var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./'),
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
      sandbox.stub(dom, 'pageUri').returns('domain.com/pages/foo');
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
  });
});
