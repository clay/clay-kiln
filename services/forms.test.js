var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  edit = require('./edit'),
  formCreator = require('./form-creator'),
  formValues = require('./form-values'),
  lib = require('./forms');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute('data-editable', 'title');
      return node;
    }

    function stubData(data) {
      sandbox.stub(edit, 'getData').returns(Promise.resolve({
        title: data
      }));
    }

    describe('open', function () {
      var fn = lib[this.title];

      beforeEach(function () {
        sandbox.stub(formCreator, 'createInlineForm', sandbox.spy());
        sandbox.stub(formCreator, 'createForm', sandbox.spy());
      });

      it('does nothing if inline forms are open', function () {
        var el = stubNode(),
          inlineFormEl = document.createElement('div');

        inlineFormEl.classList.add('editor-inline');
        el.appendChild(inlineFormEl);

        expect(fn('fakeRef', el, 'title')).to.equal(undefined);
        expect(formCreator.createInlineForm.callCount).to.equal(0);
        expect(formCreator.createForm.callCount).to.equal(0);
      });

      it('opens inline forms', function () {
        var checkForms = function () {
          expect(formCreator.createInlineForm.callCount).to.equal(1);
          expect(formCreator.createForm.callCount).to.equal(0);
        };

        stubData({
          value: '123',
          _schema: {
            _display: 'inline'
          }
        });

        return fn('fakeRef', stubNode(), 'title').then(checkForms);
      });

      it('opens overlay forms', function () {
        var checkForms = function () {
          expect(formCreator.createInlineForm.callCount).to.equal(0);
          expect(formCreator.createForm.callCount).to.equal(1);
        };

        stubData({
          value: '123',
          _schema: {
            _display: 'overlay'
          }
        });

        return fn('fakeRef', stubNode(), 'title').then(checkForms);
      });
    });

    describe('close', function () {
      var fn = lib[this.title];

      beforeEach(function () {
        sandbox.stub(formCreator, 'createInlineForm', sandbox.spy());
        sandbox.stub(formCreator, 'createForm', sandbox.spy());

        // Disable reload
        sandbox.stub(lib, 'reload').returns({});
      });

      it('closes inline forms', function () {
        var el = stubNode(),
          formContainer = document.createElement('div'),
          wrappedNodes = document.createElement('span');

        formContainer.classList.add('editor-inline');
        wrappedNodes.classList.add('hidden-wrapped');
        el.appendChild(wrappedNodes);
        el.appendChild(formContainer);
        document.body.appendChild(el);

        fn();
        expect(el.childNodes.length).to.equal(0);
      });

      it('saves the currently open inline form', function () {
        var spyEdit = sandbox.spy(edit, 'update');

        stubData({
          value: '123',
          _schema: {
            _display: 'inline'
          }
        });

        // open the form to make sure currentForm object is populated.
        return lib.open('fakeRef', stubNode(), 'title').then(function () {
          // Add a form element
          var el = stubNode(),
            formContainer = document.createElement('div'),
            form = document.createElement('form'),
            wrappedNodes = document.createElement('span');

          formContainer.classList.add('editor-inline');
          wrappedNodes.classList.add('hidden-wrapped');
          el.appendChild(wrappedNodes);
          formContainer.appendChild(form);
          el.appendChild(formContainer);
          document.body.appendChild(el);

          // Close
          lib.close();
          expect(spyEdit.calledOnce).to.equal(true);
        });
      });

      it('does not save if the data did not change', function () {

        var spyEdit = sandbox.spy(edit, 'update');

        stubData({
          value: '123',
          _schema: {
            _display: 'inline'
          }
        });

        // Make form have same data as server.
        sandbox.stub(formValues, 'get').returns({title: '123'});

        // open the form to make sure currentForm object is populated.
        return lib.open('fakeRef', stubNode(), 'title').then(function () {
          // Add a form element
          var el = stubNode(),
            formContainer = document.createElement('div'),
            form = document.createElement('form'),
            wrappedNodes = document.createElement('span');

          formContainer.classList.add('editor-inline');
          wrappedNodes.classList.add('hidden-wrapped');
          el.appendChild(wrappedNodes);
          formContainer.appendChild(form);
          el.appendChild(formContainer);
          document.body.appendChild(el);

          // Close
          lib.close();
          expect(spyEdit.calledOnce).to.equal(false);
        });

      });

      it('closes overlay forms', function () {
        var el = stubNode(),
          formContainer = document.createElement('div');

        formContainer.classList.add('editor-overlay-background');
        el.appendChild(formContainer);
        document.body.appendChild(el);

        fn();
        expect(el.childNodes.length).to.equal(0);
      });

      it('saves overlay forms', function () {
        var spyEdit = sandbox.spy(edit, 'update');

        stubData({
          value: '123',
          _schema: {
            _display: 'inline'
          }
        });
        // open the form to make sure currentForm object is populated.
        return lib.open('fakeRef', stubNode(), 'title').then(function () {
          // Add a form element
          var el = stubNode(),
            formContainer = document.createElement('div'),
            form = document.createElement('form');

          formContainer.classList.add('editor-overlay-background');
          formContainer.appendChild(form);
          el.appendChild(formContainer);
          document.body.appendChild(el);

          // Close
          lib.close();
          expect(spyEdit.calledOnce).to.equal(true);
        });
      });

      it('doesn\'t break when no forms are open', function () {
        var el = stubNode();

        document.body.appendChild(el);

        fn();
        expect(el.childNodes.length).to.equal(0);
      });
    });
  });
});
