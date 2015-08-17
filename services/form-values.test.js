var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  edit = require('./edit'),
  references = require('./references'),
  render = require('./render'),
  lib = require('./form-values');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(edit);
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'title');
      return node;
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

    describe('get', function () {
      var fn = lib[this.title];

      it('throws error if no form element', function () {
        function withValue(type) {
          return function () {
            return fn(type);
          };
        }

        expect(withValue(1)).to.throw(Error);
        expect(withValue(true)).to.throw(Error);
        expect(withValue('foo')).to.throw(Error);
        expect(withValue(null)).to.throw(Error);
        expect(withValue([])).to.throw(Error);
        expect(withValue({})).to.throw(Error);
        expect(withValue(document.createElement('div'))).to.throw(Error);
        expect(withValue(undefined)).to.throw(Error);

        expect(withValue(document.createElement('form'))).to.not.throw(Error);
      });

      it('returns empty object if no fields', function () {

      });

      it('gets string value', function () {

      });

      it('gets number value', function () {

      });

      it('gets boolean value', function () {

      });

      it('gets array value', function () {

      });

      it('gets object value', function () {

      });

      it('removes binding metadata from strings, numbers, and booleans', function () {

      });

      it('removes binding metadata from arrays', function () {

      });

      it('removes binding metadata from objects', function () {

      });

      it('removes nonbreaking spaces from strings', function () {

      });

      it('trims strings');
    });
  });
});
