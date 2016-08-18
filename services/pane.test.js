var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./pane'),
  state = require('./page-state'),
  dom = require('@nymag/dom'),
  tpl = require('./tpl'),
  edit = require('./edit'),
  ds = require('dollar-slice'),
  db = require('./edit/db');

// minimal templates, only what we need to test the logic and functionality
function stubWrapperTemplate() {
  return dom.create(`<div class="kiln-toolbar-pane-background">
    <div class="kiln-toolbar-pane">
      <header class="pane-tabs">
        <div class="pane-tabs-inner"></div>
      </header>
      <div class="pane-inner"></div>
    </div>
  </div>`);
}

function stubUndoTemplate() {
  return dom.create(`<div class="publish-undo undo kiln-hide">
    <button class="unpublish kiln-hide">Unpublish Page</button>
    <button class="unschedule kiln-hide">Unschedule</button>
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
    <button class="publish-now">Publish Now</button>
    <form class="schedule">
      <label class="schedule-label" for="schedule-date">Date</label>
      <input id="schedule-date" class="schedule-input" type="date" min="" value="" placeholder=""></input>
      <label class="schedule-label" for="schedule-time">Time</label>
      <input id="schedule-time" class="schedule-input" type="time" value="" placeholder=""></input>
      <button class="schedule-publish">Schedule Publish</button>
    </form>
  </div>`);
}

function stubCustomUrlTemplate() {
  return dom.create(`<form class="custom-url-form">
    <label for="custom-url" class="custom-url-message">Designate a custom URL for this page. This should only be used for special cases.</p>
    <input id="custom-url" class="custom-url-input" type="text" placeholder="/special-page.html" />
    <button type="submit" class="custom-url-submit">Save Location</button>
  </form>`);
}

function stubPreviewActionsTemplate() {
  return dom.create(`<ul class="preview-actions actions">
    <li class="preview-item">
      <a class="preview-link small">
        <span class="preview-link-size">s</span>
        <span class="preview-link-text">Small</span>
        <span class="preview-link-icon">↑</span>
      </a>
    </li>
    <li class="preview-item">
      <a class="preview-link medium">
        <span class="preview-link-size">m</span>
        <span class="preview-link-text">Medium</span>
        <span class="preview-link-icon">↑</span>
      </a>
    </li>
    <li class="preview-item">
      <a class="preview-link large">
        <span class="preview-link-size">l</span>
        <span class="preview-link-text">Large</span>
        <span class="preview-link-icon">↑</span>
      </a>
    </li>
  </ul>`);
}

function stubShareActionsTemplate() {
  return dom.create(`<div class="info-message">Share the link below to preview the latest version of this page.</div>
  <div class="share-actions actions">
    <input class="share-input"></input>
    <button class="share-copy">{% include 'public/media/components/clay-kiln/copy.svg' %}</button>
  </div>`);
}

function stubErrorsTemplate() {
  return dom.create(`<div class="publish-error">
    <span class="label">There was a problem:</span>
    <span class="description">Please see below for details</span>
    <ul class="errors"></ul>
  </div>`);
}

function stubFilterableItemTemplate() {
  // wrapper divs to simulate doc fragments
  return dom.create(`<div><li class="filtered-item">
    <button class="filtered-item-reorder kiln-hide" title="Reorder">=</button>
    <span class="filtered-item-title"></span>
    <button class="filtered-item-settings kiln-hide" title="Settings">*</button>
    <button class="filtered-item-remove kiln-hide" title="Remove">X</button>
  </li></div>`);
}

function stubFilteredAddTemplate() {
  return dom.create(`<div class="filtered-add">
    <button class="filtered-add-button" title="Add To List">+</button>
    <span class="filtered-add-title">Add To List</span>
  </div>`);
}

describe(dirname, function () {
  describe(filename, function () {
    var sandbox, getTemplate;

    beforeEach(function () {
      var toolbar = dom.create('<div class="kiln-toolbar"></div>');

      document.body.appendChild(toolbar);
      sandbox = sinon.sandbox.create();
      sandbox.stub(dom, 'pageUri').returns('domain.com/pages/foo');
      getTemplate = sandbox.stub(tpl, 'get');
      getTemplate.withArgs('.kiln-pane-template').returns(stubWrapperTemplate());
      getTemplate.withArgs('.publish-valid-template').returns(dom.create('<div class="publish-valid">valid</div>'));
      getTemplate.withArgs('.publish-undo-template').returns(stubUndoTemplate());
      getTemplate.withArgs('.publish-messages-template').returns(stubMessageTemplate());
      getTemplate.withArgs('.publish-actions-template').returns(stubPublishTemplate());
      getTemplate.withArgs('.preview-actions-template').returns(stubPreviewActionsTemplate());
      getTemplate.withArgs('.share-actions-template').returns(stubShareActionsTemplate());
      getTemplate.withArgs('.publish-error-message-template').returns(dom.create('<div>ERROR MESSAGE</div>'));
      getTemplate.withArgs('.publish-warning-message-template').returns(dom.create('<div>WARNING MESSAGE</div>'));
      getTemplate.withArgs('.publish-errors-template').returns(stubErrorsTemplate());
      getTemplate.withArgs('.custom-url-form-template').returns(stubCustomUrlTemplate());
      getTemplate.withArgs('.filtered-input-template').returns(dom.create('<input class="filtered-input" />'));
      getTemplate.withArgs('.filtered-items-template').returns(dom.create('<div><ul class="filtered-items"></div>')); // wrapper divs to simulate doc fragments
      getTemplate.withArgs('.filtered-item-template').returns(stubFilterableItemTemplate());
      getTemplate.withArgs('.filtered-add-template').returns(stubFilteredAddTemplate());
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

    describe('openNewPage', function () {
      var fn = lib[this.title],
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
        sandbox.stub(db, 'get');
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('opens a a new page pane', function () {
        function expectNewPageItems(el) {
          expect(el.querySelector('#pane-tab-1').innerHTML).to.equal('New Page');
          expect(el.querySelectorAll('.pane-inner li.filtered-item').length).to.equal(1);
        }
        db.get.returns(Promise.resolve([{
          id: 'new',
          title: 'New Page'
        }]));
        lib.close();
        return fn().then(expectNewPageItems);
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
