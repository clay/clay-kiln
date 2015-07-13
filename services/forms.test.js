var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  edit = require('./edit'),
  formCreator = require('./form-creator'),
  formValues = require('./form-values'),
  lib = require('./forms');

function resolver() {
  return Promise.resolve();
}

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      // Disable reload
      sandbox.stub(lib, 'reload').returns({});
      lib.close();
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

    /**
     * Adds an inline form element to the dom with proper classNames.
     * @returns {Element} The element added to the dom.
     */
    function addInlineFormElement() {
      var el = stubNode(),
        formContainer = document.createElement('div'),
        form = document.createElement('form'),
        wrappedNodes = document.createElement('span');

      formContainer.classList.add('editor-inline');
      wrappedNodes.classList.add('hidden-wrapped');
      formContainer.appendChild(form);
      el.appendChild(wrappedNodes);
      el.appendChild(formContainer);
      document.body.appendChild(el);
      return el;
    }

    /**
     * Adds an overlay form element to the dom with proper classNames.
     * @returns {Element} The element added to the dom.
     */
    function addOverlayFormElement() {
      var el = stubNode(),
        formContainer = document.createElement('div'),
        form = document.createElement('form');

      formContainer.classList.add('editor-overlay-background');
      el.appendChild(formContainer);
      formContainer.appendChild(form);
      document.body.appendChild(el);
      return el;
    }

    describe('open', function () {
      var fn = lib[this.title];

      beforeEach(function () {
        sandbox.stub(formCreator, 'createInlineForm', resolver);
        sandbox.stub(formCreator, 'createForm', resolver);
      });

      it('does not open a second form if a form is already open', function () {
        function afterFormIsOpen() {
          // Then do not allow another form to open.
          expect(fn('fakeRef', stubNode(), 'title')).to.equal(undefined);
          expect(formCreator.createInlineForm.callCount).to.equal(1);
          expect(formCreator.createForm.callCount).to.equal(0);
        }
        // First open a form.
        stubData({
          value: '123',
          _schema: {
            _display: 'inline'
          }
        });
        return fn('fakeRef', stubNode(), 'title').then(afterFormIsOpen);
      });

      it('opens inline forms', function () {
        function afterFormIsOpen() {
          expect(formCreator.createInlineForm.callCount).to.equal(1);
          expect(formCreator.createForm.callCount).to.equal(0);
        }
        // First open a form.
        stubData({
          value: '123',
          _schema: {
            _display: 'inline'
          }
        });
        return fn('fakeRef', stubNode(), 'title').then(afterFormIsOpen);
      });

      it('opens overlay forms', function () {
        var checkForms = function () {
          expect(formCreator.createInlineForm.callCount).to.equal(0);
          expect(formCreator.createForm.callCount).to.equal(1);
        };

        // First open an overlay form.
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
        sandbox.stub(edit, 'update', resolver);
        sandbox.stub(formCreator, 'createInlineForm', resolver);
        sandbox.stub(formCreator, 'createForm', resolver);
      });

      it('does not remove or save when no forms are open', function () {
        var el = stubNode();

        document.body.appendChild(el);
        fn();
        expect(el.childNodes.length).to.equal(0);
        expect(edit.update.callCount).to.equal(0);
      });

      it('removes and saves inline forms when the data has changed', function () {
        var el = addInlineFormElement(); // Adds form element to dom.

        function afterFormIsClosed() {
          expect(el.childNodes.length).to.equal(0); // form element was removed.
          expect(edit.update.calledOnce).to.equal(true); // data was saved.
        }
        function afterFormIsOpen() {
          return fn().then(afterFormIsClosed);
        }
        // First open an inline form.
        stubData({
          value: '123',
          _schema: {
            _name: 'title',
            _display: 'inline',
            _has: 'text'
          }
        });
        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen);
      });

      it('only removes (and does not save) inline forms when the data has not changed', function () {
        var el = addInlineFormElement(); // Add form element to dom.

        function afterFormIsClosed() {
          expect(el.childNodes.length).to.equal(0); // form element was removed.
          expect(edit.update.callCount).to.equal(0); // data was not saved.
        }
        function afterFormIsOpen() {
          return fn().then(afterFormIsClosed);
        }
        // Make sure form data is the same as the server data.
        sandbox.stub(formValues, 'get').returns({title: '123'});
        // First open an inline form.
        stubData({
          value: '123',
          _schema: {
            _name: 'title',
            _display: 'inline',
            _has: 'text'
          }
        });
        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen);
      });

      it('removes and saves overlay forms when the data has changed', function () {
        var el = addOverlayFormElement(); // Adds an overlay form element to dom.

        function afterFormIsClosed() {
          expect(el.childNodes.length).to.equal(0); // form element was removed.
          expect(edit.update.calledOnce).to.equal(true); // data was saved.
        }
        function afterFormIsOpen() {
          return fn().then(afterFormIsClosed);
        }
        // First open an inline form.
        stubData({
          value: '123',
          _schema: {
            _display: 'overlay',
            _name: 'title',
            _has: 'text'
          }
        });
        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen);
      });

      it('only removes (and does not save) overlay forms when the data has not changed', function () {
        var el = addOverlayFormElement(); // Adds an overlay form element to dom.

        function afterFormIsClosed() {
          expect(el.childNodes.length).to.equal(0); // form element was removed.
          expect(edit.update.callCount).to.equal(0); // data was not saved.
        }
        function afterFormIsOpen() {
          return fn().then(afterFormIsClosed);
        }
        // Make sure form data is the same as the server data.
        sandbox.stub(formValues, 'get').returns({title: '123'});
        // First open an inline form.
        stubData({
          value: '123',
          _schema: {
            _display: 'overlay',
            _name: 'title',
            _has: 'text'
          }
        });
        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen);
      });
    });
  });
});
