var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  edit = require('./edit'),
  lib = require('./pane'),
  state = require('./page-state'),
  ds = require('dollar-slice'),
  setupNunjucksTemplate = function () {
    var noFilter = function () {},
      env = new nunjucks.Environment();

    // satisfy request for nunjucks filter in template
    env.addFilter('includeFile', noFilter); // TODO – include nunjucks filters
    return env.getPreprocessedTemplate('template.nunjucks');
  };

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
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
          innerEl = document.createElement('div'),
          template = document.createElement('template'),
          headEl = document.createElement('div'),
          paneInnerEl = document.createElement('div'),
          toolbar = document.createElement('div');

        // add template
        template.classList.add('kiln-pane-template');
        headEl.classList.add('pane-header');
        paneInnerEl.classList.add('pane-inner');
        template.content.appendChild(headEl);
        template.content.appendChild(paneInnerEl);
        document.body.appendChild(template);

        // add toolbar
        toolbar.classList.add('kiln-toolbar');
        document.body.appendChild(toolbar);

        // run!
        innerEl.classList.add('test-pane');
        fn(header, innerEl);
        expect(document.querySelector('.pane-header').innerHTML).to.equal('Test Pane');
        expect(document.querySelector('.pane-inner').innerHTML).to.equal('<div class="test-pane"></div>');
      });
    });

    describe('openPublish', function () {
      var fn = lib[this.title],
        sandbox, getState;

      before(function () {
        var template = document.createElement('template'),
          headEl = document.createElement('div'),
          paneInnerEl = document.createElement('div'),
          toolbar = document.createElement('div');

        // add template
        template.classList.add('kiln-pane-template');
        headEl.classList.add('pane-header');
        paneInnerEl.classList.add('pane-inner');
        template.content.appendChild(headEl);
        template.content.appendChild(paneInnerEl);
        document.body.appendChild(template);

        // add toolbar
        toolbar.classList.add('kiln-toolbar');
        document.body.appendChild(toolbar);
      });

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
      var mock = {
          locals: {edit: true}
        },
        noFilter = function () {},
        createPage, el, env, pagePane, result, sandbox, stub, template;

      before(function () {
        env = new nunjucks.Environment();
        // satisfy request for nunjucks filter in template
        env.addFilter('includeFile', noFilter); // TODO – include nunjucks filters
        template = env.getPreprocessedTemplate('template.nunjucks');
      });

      beforeEach(function () {
        result = template.render(mock);
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
      });

      afterEach(function () {
        document.body.innerHTML = undefined;
        el = undefined;
        sandbox.restore();
      });

      it('has a template skeleton for selecting page type', function () {
        document.body.innerHTML += result;
        el = document.querySelector('.new-page-actions');
        expect(el).to.exist;
      });

      it('has a toolbar button for opening the page type selection dialog', function () {
        document.body.innerHTML += result;
        el = document.querySelector('.kiln-toolbar-button.new');
        expect(el).to.exist;
      });

      it('creates a clone of the pane template on [+ page] button click', function () {
        lib.close();
        document.body.innerHTML += result;
        el = document.querySelector('.kiln-toolbar-button.new');
        sandbox.stub(el, 'click', function () { // TODO – remove stub once filters are functional
          pagePane = document.querySelector('.kiln-pane-template-elements .new-page-actions');
        });
        el.click();

        function clickToOpenPane() {
          expect(pagePane).to.exist;
        }

        clickToOpenPane();
      });

      it('opens a create page pane and clicks new article page button', sinon.test(function () {
        lib.close();
        document.body.innerHTML += result;
        el = document.querySelector('.new-page-actions .create-article-page');
        stub = sandbox.stub(el, 'click');
        el.click();
        sinon.assert.called(stub);
      }));

      it('creates a new article page', sinon.test(function () {
        createPage = sandbox.spy(edit, 'createPage');
        lib.close();
        expect(createPage.returned(Promise.resolve({}))).to.exist;
      }));
    });

    describe('openPreview', function () {
      var mock = {
          locals: {edit: true}
        },
        el, previewPane, sandbox, template, templateRendered;

      before(function () {
        template = setupNunjucksTemplate();
      });

      beforeEach(function () {
        templateRendered = template.render(mock);
        sandbox = sinon.sandbox.create();
      });

      afterEach(function () {
        document.body.innerHTML = undefined;
        el = undefined;
        sandbox.restore();
      });

      it('has a template skeleton for preview info', function () {
        document.body.innerHTML += templateRendered;
        el = document.querySelector('.preview-actions');
        expect(el).to.exist;
      });

      it('has a toolbar button for opening the preview dialog', function () {
        document.body.innerHTML += templateRendered;
        el = document.querySelector('.kiln-toolbar-button.preview');
        expect(el).to.exist;
      });

      it('creates a clone of the pane template on [√ preview] button click', function () {
        lib.close();
        document.body.innerHTML += templateRendered;
        el = document.querySelector('.kiln-toolbar-button.preview');
        sandbox.stub(el, 'click', selectPreviewPane);
        el.click();

        function selectPreviewPane() {
          previewPane = document.querySelector('.kiln-pane-template-elements .preview-actions');
        }

        expect(previewPane).to.exist;
      });
    });

    describe('openValidationErrors', function () {
      var mock = {
          locals: {edit: true}
        },
        noFilter = function () {},
        el, env, result, sandbox, template;

      before(function () {
        env = new nunjucks.Environment();
        // satisfy request for nunjucks filter in template
        env.addFilter('includeFile', noFilter); // TODO – include nunjucks filters
        template = env.getPreprocessedTemplate('template.nunjucks');
      });

      beforeEach(function () {
        result = template.render(mock);
        sandbox = sinon.sandbox.create();
        sandbox.stub(ds);
      });

      afterEach(function () {
        document.body.innerHTML = undefined;
        el = undefined;
        sandbox.restore();
      });

      it('opens an error pane', function () {
        document.body.innerHTML += result;
        el = document.querySelector('.publish-errors');
        expect(el).to.exist;
      });
    });
  });
});
