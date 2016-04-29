var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./pane'),
  state = require('./page-state'),
  ds = require('dollar-slice');

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

    describe('openValidationErrors', function () {
      var fn = lib[this.title],
        sandbox;

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
        sandbox.stub(state, 'get');
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('opens an error pane', function () {
        lib.close();

        function expectPane() {
          expect(document.querySelector('.pane-inner .error-message')).to.not.equal(null);
        }

        fn([{
          errors: [{ preview: 'ugh', label: 'no' }],
          rule: {
            label: 'no',
            description: 'bad data'
          }
        }]);
        expectPane();
      });
    });
  });
});
