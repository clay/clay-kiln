var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  pane = require('./'),
  lib = require('./publish-view'),
  state = require('../page-state'),
  dom = require('@nymag/dom'),
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
      sandbox.stub(dom, 'pageUri').returns('domain.com/pages/foo');
      sandbox.stub(tpl, 'get');
      sandbox.stub(ds);
      sandbox.stub(state, 'get');
      fixture.stubAll([
        '.kiln-pane-template',
        '.publish-valid-template',
        '.publish-undo-template',
        '.publish-messages-template',
        '.publish-actions-template',
        '.publish-error-message-template',
        '.publish-warning-message-template',
        '.publish-errors-template',
        '.custom-url-form-template'
      ], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('opens a publish pane', function () {
      state.get.returns(Promise.resolve({}));
      pane.close();

      function expectRegularPane() {
        expect(document.querySelector('#pane-tab-1').innerHTML).to.equal('Publish');
        expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unschedule')).to.equal(null);
        expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unpublish')).to.equal(null);
      }

      lib().then(expectRegularPane);
    });

    it('adds unschedule if page is scheduled', function () {
      state.get.returns(Promise.resolve({ scheduled: true }));
      pane.close();

      function expectScheduledPane() {
        expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unschedule')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unpublish')).to.equal(null);
      }

      lib().then(expectScheduledPane);
    });

    it('adds unpublish if page is published', function () {
      state.get.returns(Promise.resolve({ published: true }));
      pane.close();

      function expectScheduledPane() {
        expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unschedule')).to.equal(null);
        expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unpublish')).to.not.equal(null);
      }

      lib().then(expectScheduledPane);
    });

    it('adds unschedule and unpublish if page is scheduled and published', function () {
      state.get.returns(Promise.resolve({ scheduled: true, published: true }));
      pane.close();

      function expectScheduledPane() {
        expect(document.querySelector('.pane-inner .schedule-publish')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unschedule')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .publish-now')).to.not.equal(null);
        expect(document.querySelector('.pane-inner .unpublish')).to.not.equal(null);
      }

      lib().then(expectScheduledPane);
    });

    it('adds valid message if there are no warnings', function () {
      state.get.returns(Promise.resolve({}));
      pane.close();

      function expectRegularPane() {
        expect(document.querySelector('.pane-inner .publish-valid').innerHTML).to.equal('valid');
      }

      lib().then(expectRegularPane);
    });

    it('adds warning message if warnings are passed in', function () {
      state.get.returns(Promise.resolve({}));
      pane.close();

      function expectRegularPane() {
        expect(document.querySelector('.pane-inner .publish-valid')).to.equal(null);
        expect(document.querySelector('.pane-inner .publish-warning .label').innerHTML).to.equal('Wrong:'); // note the semicolon
        expect(document.querySelector('.pane-inner .publish-warning .description').innerHTML).to.equal('Way');
        expect(document.querySelectorAll('.pane-inner .errors li').length).to.equal(1);
      }

      lib({ errors: [], warnings: [{
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
      state.get.returns(Promise.resolve({}));
      pane.close();

      function expectRegularPane() {
        expect(document.querySelector('.pane-inner .publish-valid')).to.equal(null);
        expect(document.querySelector('.pane-inner .publish-warning .label').innerHTML).to.equal('Wrong:'); // note the semicolon
        expect(document.querySelector('.pane-inner .publish-warning .description').innerHTML).to.equal('Way');
        expect(document.querySelectorAll('.pane-inner .errors li').length).to.equal(1);
      }

      lib({ warnings: [], errors: [{
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
  });
});
