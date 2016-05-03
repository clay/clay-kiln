var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./pane'),
  state = require('./page-state'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice');

// minimal templates, only what we need to test the logic and functionality
function stubWrapperTemplate() {
  return dom.create(`<div class="kiln-toolbar-pane-background">
    <div class="kiln-toolbar-pane">
      <span class="pane-header"></span>
      <div class="pane-inner"></div>
    </div>
  </div>`);
}

function stubMessageTemplate() {
  return dom.create(`<div class="publish-messages messages">
    <p class="publish-state-message">In Draft.</p>
    <p class="publish-schedule-message kiln-hide">Scheduled to publish</p>
  </div>`);
}

function stubPublishTemplate() {
  return dom.create(`<div class="publish-actions actions">
    <form class="schedule">
      <label class="schedule-label" for="schedule-date">Date</label>
      <input id="schedule-date" class="schedule-input" type="date" min="" value="" placeholder=""></input>
      <label class="schedule-label" for="schedule-time">Time</label>
      <input id="schedule-time" class="schedule-input" type="time" value="" placeholder=""></input>
      <button class="schedule-publish">Schedule Publish</button>
    </form>
    <button class="unschedule kiln-hide">Unschedule</button>
    <button class="publish-now">Publish Now</button>
    <button class="unpublish kiln-hide">Unpublish Page</button>
  </div>`);
}

function stubNewPageActionsTemplate() {
  return dom.create(`<div class="new-page-actions actions">
    <form class="select-page-type">
      <button class="create-article-page primary-action">New Article Page</button>
      <button class="create-sponsored-post primary-action">New Sponsored Post</button>
    </form>
  </div>`);
}

function stubErrorsTemplate() {
  return dom.create(`<div class="publish-error">
    <span class="label">There was a problem:</span>
    <span class="description">Please see below for details</span>
    <ul class="errors"></ul>
  </div>`);
}

describe(dirname, function () {
  describe(filename, function () {
    var sandbox, getTemplate;

    beforeEach(function () {
      var toolbar = dom.create('<div class="kiln-toolbar"></div>');

      document.body.appendChild(toolbar);
      sandbox = sinon.sandbox.create();
      getTemplate = sandbox.stub(lib, 'getTemplate');
      getTemplate.withArgs('.kiln-pane-template').returns(stubWrapperTemplate());
      getTemplate.withArgs('.publish-messages-template').returns(stubMessageTemplate());
      getTemplate.withArgs('.publish-actions-template').returns(stubPublishTemplate());
      getTemplate.withArgs('.new-page-actions-template').returns(stubNewPageActionsTemplate());
      getTemplate.withArgs('.publish-error-message-template').returns(dom.create('<div>ERROR MESSAGE</div>'));
      getTemplate.withArgs('.publish-errors-template').returns(stubErrorsTemplate());
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

      it('opens a pane with header and innerEl', function () {
        var header = 'Test Pane',
          innerEl = document.createElement('div');

        // run!
        innerEl.classList.add('test-pane');
        lib.close();
        fn(header, innerEl);
        expect(document.querySelector('.pane-header').innerHTML).to.equal('Test Pane');
        expect(document.querySelector('.pane-inner').innerHTML).to.equal('<div class="test-pane"></div>');
      });

      it('opens a pane with a modifier class', function (done) {
        var header = 'Test Pane',
          innerEl = document.createElement('div');

        function expectClass() {
          expect(document.querySelector('.kiln-toolbar-pane').classList.contains('test-pane-wrapper')).to.equal(true);
          done();
        }

        // run!
        innerEl.classList.add('test-pane');
        lib.close();
        fn(header, innerEl, 'test-pane-wrapper');
        setTimeout(expectClass, 0);
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
          expect(document.querySelector('.pane-header').innerHTML).to.equal('Schedule Publish');
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
    });

    describe('openNewPage', function () {
      var fn = lib[this.title],
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('opens a new page pane', function () {
        lib.close();
        fn();
        expect(document.querySelector('.pane-header').innerHTML).to.equal('New Page');
        expect(document.querySelectorAll('.pane-inner button').length).to.equal(2);
      });
    });

    describe('openValidationErrors', function () {
      var fn = lib[this.title],
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('opens with no errors', function () {
        lib.close();
        fn({ errors: [], warnings: [] });
        expect(document.querySelector('.pane-header').innerHTML).to.equal('Before you can publish…');
        expect(document.querySelector('.pane-inner').innerHTML).to.equal('<div>ERROR MESSAGE</div>'); // just the message, nothing else!
      });

      it('opens with errors', function () {
        lib.close();
        fn({ errors: [{
          rule: {
            label: 'Wrong',
            description: 'Way'
          },
          errors: [{
            label: 'Foo',
            preview: 'Bar'
          }]
        }], warnings: []});
        expect(document.querySelector('.pane-header').innerHTML).to.equal('Before you can publish…');
        expect(document.querySelector('.pane-inner .publish-error .label').innerHTML).to.equal('Wrong:'); // note the semicolon
        expect(document.querySelector('.pane-inner .publish-error .description').innerHTML).to.equal('Way');
        expect(document.querySelectorAll('.pane-inner .errors li').length).to.equal(1);
      });

      it('opens with warnings', function () {
        lib.close();
        fn({ errors: [],
          warnings: [{
            rule: {
              label: 'Wrong',
              description: 'Way'
            },
            errors: [{
              label: 'Foo',
              preview: 'Bar'
            }]
          }]});
        expect(document.querySelector('.pane-header').innerHTML).to.equal('Before you can publish…');
        expect(document.querySelector('.pane-inner .publish-warning .label').innerHTML).to.equal('Wrong:'); // note the semicolon
        expect(document.querySelector('.pane-inner .publish-warning .description').innerHTML).to.equal('Way');
        expect(document.querySelectorAll('.pane-inner .errors li').length).to.equal(1);
      });

      it('uses default label and/or description', function () {
        lib.close();
        fn({ errors: [{
          rule: {},
          errors: []
        }], warnings: []});
        expect(document.querySelector('.pane-inner .publish-error .label').innerHTML).to.equal('There was a problem:');
        expect(document.querySelector('.pane-inner .publish-error .description').innerHTML).to.equal('Please see below for details');
        expect(document.querySelector('.pane-inner .errors')).to.not.equal(null);
        expect(document.querySelectorAll('.pane-inner .errors li').length).to.equal(0);
      });
    });
  });
});
