var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./'),
  state = require('../page-state'),
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
        '.publish-valid-template',
        '.publish-undo-template',
        '.publish-messages-template',
        '.publish-actions-template',
        '.preview-actions-template',
        '.share-actions-template',
        '.publish-error-message-template',
        '.publish-warning-message-template',
        '.publish-errors-template',
        '.custom-url-form-template',
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

    describe('openPublish', function () {
      var fn = lib[this.title],
        sandbox, getState;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
        getState = sandbox.stub(state, 'get');
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('opens a publish pane', function () {
        getState.returns(Promise.resolve({}));
        lib.close();

        function expectRegularPane() {
          expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('Publish');
          expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unschedule')).to.equal(null);
          expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unpublish')).to.equal(null);
        }

        fn().then(expectRegularPane);
      });

      it('adds unschedule if page is scheduled', function () {
        getState.returns(Promise.resolve({ scheduled: true }));
        lib.close();

        function expectScheduledPane() {
          expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unschedule')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unpublish')).to.equal(null);
        }

        fn().then(expectScheduledPane);
      });

      it('adds unpublish if page is published', function () {
        getState.returns(Promise.resolve({ published: true }));
        lib.close();

        function expectScheduledPane() {
          expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unschedule')).to.equal(null);
          expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unpublish')).to.not.equal(null);
        }

        fn().then(expectScheduledPane);
      });

      it('adds unschedule and unpublish if page is scheduled and published', function () {
        getState.returns(Promise.resolve({ scheduled: true, published: true }));
        lib.close();

        function expectScheduledPane() {
          expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unschedule')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
          expect(document.querySelector('.pane-inner .unpublish')).to.not.equal(null);
        }

        fn().then(expectScheduledPane);
      });

      it('adds valid message if there are no warnings', function () {
        getState.returns(Promise.resolve({}));
        lib.close();

        function expectRegularPane() {
          expect(document.querySelector('.pane-inner .publish-valid').innerHTML).to.equal('valid');
        }

        fn().then(expectRegularPane);
      });

      it('adds warning message if warnings are passed in', function () {
        getState.returns(Promise.resolve({}));
        lib.close();

        function expectRegularPane() {
          expect(document.querySelector('.pane-inner .publish-valid')).to.equal(null);
          expect(document.querySelector('.pane-inner .publish-warning .label').innerHTML).to.equal('Wrong:'); // note the semicolon
          expect(document.querySelector('.pane-inner .publish-warning .description').innerHTML).to.equal('Way');
          expect(document.querySelectorAll('.pane-inner .errors li').length).to.equal(1);
        }

        fn({ errors: [], warnings: [{
          rule: {
            label: 'Wrong',
            description: 'Way'
          },
          errors: [{
            label: 'Foo',
            preview: 'Bar'
          }]
        }]}).then(expectRegularPane);
      });

      it('adds error message if errors are passed in', function () {
        getState.returns(Promise.resolve({}));
        lib.close();

        function expectRegularPane() {
          expect(document.querySelector('.pane-inner .publish-valid')).to.equal(null);
          expect(document.querySelector('.pane-inner .publish-warning .label').innerHTML).to.equal('Wrong:'); // note the semicolon
          expect(document.querySelector('.pane-inner .publish-warning .description').innerHTML).to.equal('Way');
          expect(document.querySelectorAll('.pane-inner .errors li').length).to.equal(1);
        }

        fn({ warnings: [], errors: [{
          rule: {
            label: 'Wrong',
            description: 'Way'
          },
          errors: [{
            label: 'Foo',
            preview: 'Bar'
          }]
        }]}).then(expectRegularPane);
      });

      it('adds custom url if it exists', function () {
        getState.returns(Promise.resolve({ customUrl: 'http://domain.com/foo' }));
        lib.close();

        function expectCustomUrl() {
          expect(document.querySelector('#pane-tab-2').innerHTML).to.equal('Location');
          expect(document.querySelector('.pane-inner .custom-url-input').value).to.equal('/foo');
        }

        fn().then(expectCustomUrl);
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
