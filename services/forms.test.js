var _ = require('lodash'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  edit = require('./edit'),
  references = require('./references'),
  render = require('./render'),
  formCreator = require('./form-creator'),
  formValues = require('./form-values'),
  lib = require('./forms'),
  expect = require('chai').expect,
  assert = require('chai').assert;

function resolver() {
  return Promise.resolve();
}

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(edit);

      // Close any forms that may have been opened.
      lib.close();
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'title');
      return node;
    }

    function stubData(data) {
      edit.getData.returns(Promise.resolve({
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
          expect(document.body.classList.contains(references.editingStatus)).to.equal(true); // editing status updated.
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
          expect(document.body.classList.contains(references.editingStatus)).to.equal(true); // editing status updated.
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

      function expectFormToBeRemoved(el) {
        assert(el.childNodes.length === 0, 'Expected form to be removed');
      }

      function expectDataWasNotSaved() {
        assert(edit.save.callCount === 0 && edit.savePartial.callCount === 0, 'Expected data to not be saved.');
      }

      function expectDataWasSavedOnce() {
        assert(edit.save.callCount + edit.savePartial.callCount === 1, 'Expected data to be saved once.');
      }

      function expectReloadCount(num) {
        var callCount = render.reloadComponent.callCount;

        assert(callCount === num, 'Expected element to be reloaded ' + num +
          ' times, not ' + callCount);
      }

      function expectEditingToBeDone() {
        assert(document.body.classList.contains(references.editingStatus) === false, 'Expected editingStatus to be false');
      }

      function afterFormIsOpen(afterFormIsClosed) {
        return function () {
          return fn().then(afterFormIsClosed);
        };
      }

      beforeEach(function () {
        edit.savePartial.returns(Promise.resolve());
        sandbox.stub(formCreator, 'createInlineForm', resolver);
        sandbox.stub(formCreator, 'createForm', resolver);
        sandbox.stub(render, 'reloadComponent', resolver);
      });

      it('does not remove or save when no forms are open', function () {
        var el = stubNode();

        document.body.appendChild(el);
        fn();
        expectFormToBeRemoved(el);
        expectDataWasNotSaved();
        expectReloadCount(0);
      });

      it('removes and saves inline forms when the data has changed', function () {
        var el = addInlineFormElement(), // Adds form element to dom.
          data = {
            value: '123',
            _schema: {
              _name: 'title',
              _display: 'inline',
              _has: 'text'
            }
          },
          newData = _.cloneDeep(data);

        function afterFormIsClosed() {
          expectFormToBeRemoved(el);
          expectDataWasSavedOnce();
          expectReloadCount(1);
          expectEditingToBeDone();
        }

        // Make sure form data is different than the server data.
        newData.value = '456';
        sandbox.stub(formValues, 'get').returns({title: newData});
        stubData(data);

        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen(afterFormIsClosed));
      });

      it('only removes (and does not save) inline forms when the data has not changed', function () {
        var el = addInlineFormElement(), // Add form element to dom.
          data = {
            value: '123',
            _schema: {
              _name: 'title',
              _display: 'inline',
              _has: 'text'
            }
          };

        function afterFormIsClosed() {
          expectFormToBeRemoved(el);
          expectDataWasNotSaved();
          expectReloadCount(0);
          expectEditingToBeDone();
        }

        // Make sure form data is the same as the server data.
        sandbox.stub(formValues, 'get').returns({title: data});
        // First open an inline form.
        stubData(data);

        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen(afterFormIsClosed));
      });

      it('removes and saves overlay forms when the data has changed', function () {
        var el = addOverlayFormElement(), // Adds an overlay form element to dom.
          data = {
            value: '123',
            _schema: {
              _display: 'overlay',
              _name: 'title',
              _has: 'text'
            }
          },
          newData = _.cloneDeep(data);

        function afterFormIsClosed() {
          expectFormToBeRemoved(el);
          expectDataWasSavedOnce();
          expectReloadCount(1);
          expectEditingToBeDone();
        }

        // Make sure form data is different than the server data.
        newData.value = '456';
        sandbox.stub(formValues, 'get').returns({title: newData});
        stubData(data);

        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen(afterFormIsClosed));
      });

      it('only removes (and does not save) overlay forms when the data has not changed', function () {
        var el = addOverlayFormElement(), // Adds an overlay form element to dom.
          data = {
            value: '123',
            _schema: {
              _display: 'overlay',
              _name: 'title',
              _has: 'text'
            }
          };

        function afterFormIsClosed() {
          expectFormToBeRemoved(el);
          expectDataWasNotSaved();
          expectReloadCount(0);
          expectEditingToBeDone();
        }

        // Make sure form data is the same as the server data.
        sandbox.stub(formValues, 'get').returns({title: data});
        // First open an inline form.
        stubData(data);

        return lib.open('fakeRef', stubNode(), 'title').then(afterFormIsOpen(afterFormIsClosed));
      });
    });

    describe('dataChanged', function () {
      var fn = lib[this.title],
        mockServerData,
        mockFormData;

      beforeEach(function () {
        // reset the mock data.
        mockServerData = {
          text: {
            _schema: {
              _placeholder: {},
              _display: 'inline',
              _has: [],
              _name: 'text'
            },
            value: ''
          },
          _ref: 'site/path/components/paragraph/instances/0',
          _schema: {
            text: {
              _placeholder: {},
              _display: 'inline',
              _has: [],
              _name: 'text'
            }
          }
        };
        mockFormData = {
          text: {
            _schema: {
              _placeholder: {},
              _display: 'inline',
              _has: [],
              _name: 'text'
            },
            value: ''
          }
        };
      });

      it('returns false if values are equal', function () {
        mockServerData.text.value = 'hello';
        mockFormData.text.value = 'hello';
        expect(fn(mockServerData, mockFormData)).to.be.false;
      });

      it('returns true if values are not equal', function () {
        mockServerData.text.value = 'hello';
        mockFormData.text.value = 'hello, world';
        expect(fn(mockServerData, mockFormData)).to.be.true;
      });

      it('returns true if a form adds a field (happens when field has `component_ref` behavior)', function () {
        mockFormData.additionalField = {};
        expect(fn(mockServerData, mockFormData)).to.be.true;
      });
    });

    describe('isFormValid', function () {
      var fn = lib[this.title];

      function stubForm(isValid) {
        var formClass = 'editor-overlay-background',
          container = document.createElement('div'),
          form = document.createElement('form'),
          input = document.createElement('input'),
          validityMessage = isValid ? '' : 'Not valid';

        // remove any open forms
        _.each(document.querySelectorAll('.' + formClass), (el) => el.parentNode.removeChild(el));

        // add new form
        container.classList.add(formClass);
        input.setCustomValidity(validityMessage);
        form.appendChild(input);
        container.appendChild(form);
        document.body.appendChild(container);
      }

      it('returns true if no open form', function () {
        expect(fn()).to.equal(true);
      });

      it('returns true if valid open form', function () {
        stubForm(true);
        expect(fn()).to.equal(true);
      });

      it('returns false if invalid form', function () {
        stubForm(false);
        expect(fn()).to.equal(false);
      });
    });
  });
});
