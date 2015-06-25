var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  references = require('./references'),
  lib = require('./select');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    function stubEditableElement() {
      var node = document.createElement('div');

      node.setAttribute('data-editable', 'content');
      return node;
    }

    function stubComponent() {
      var node = document.createElement('div');

      node.setAttribute(references.referenceAttribute, '/components/foo/id/bar');
      return node;
    }

    function stubEditableComponent() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'content');
      node.setAttribute(references.referenceAttribute, '/components/foo/id/bar');
      return node;
    }

    describe('select', function () {
      var fn = lib[this.title];

      it('adds .selected class when element is inside component', function () {
        var el = stubEditableElement(),
          component = stubComponent();

        component.appendChild(el);

        fn(el);
        expect(component.classList.contains('selected')).to.equal(true);
      });

      it('adds .selected-parent class when parent component exists', function () {
        var el = stubEditableElement(),
          component = stubComponent(),
          parent = stubComponent();

        parent.appendChild(component);
        component.appendChild(el);

        fn(el);
        expect(parent.classList.contains('selected-parent')).to.equal(true);
      });

      it('adds .selected class when element is component', function () {
        var el = stubEditableComponent();

        fn(el);
        expect(el.classList.contains('selected')).to.equal(true);
      });

      it('adds .selected-parent class when parent component exists and elemnent is component', function () {
        var el = stubEditableComponent(),
          parent = stubComponent();

        parent.appendChild(el);

        fn(el);
        expect(parent.classList.contains('selected-parent')).to.equal(true);
      });

      it('throws error if element is not inside a component', function () {
        var el = stubEditableElement(),
          result = function () {
            return fn(el);
          };

        expect(result).to.throw(Error);
      });
    });

    describe('unselect', function () {
      var fn = lib[this.title];

      it('removed .selected class', function () {
        var el = stubEditableElement(),
          component = stubComponent();

        component.appendChild(el);

        lib.select(el);
        fn(); // unselect
        expect(component.classList.contains('selected')).to.equal(false);
      });
    });

    describe('when', function () {
      var fn = lib[this.title];

      it('returns false if not root component element', function () {
        expect(fn(stubEditableElement())).to.equal(false);
      });

      it('returns true if root component element', function () {
        expect(fn(stubEditableComponent())).to.equal(true);
      });
    });

    describe('handler', function () {
      var fn = lib[this.title];

      it('creates a component bar as the component\'s first child element', function () {
        var el = stubComponent();

        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        expect(fn(el, {ref: 'fakeRef'}).childNodes[0].classList.contains('component-bar')).to.equal(true);
      });

      it('adds the .component-bar-wrapper class to the component', function () {
        var el = stubComponent();

        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        expect(fn(el, {ref: 'fakeRef'}).classList.contains('component-bar-wrapper')).to.equal(true);
      });

      it('will select parent component if parent bar is clicked', function () {
        var el = stubComponent();

        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        fn(el, {ref: 'fakeRef'});

        // the component shouldn't be selected yet
        expect(el.classList.contains('selected')).to.equal(false);

        // trigger a click on the component bar
        el.querySelector('.component-bar').dispatchEvent(new Event('click'));

        // the component should now be selected
        expect(el.classList.contains('selected')).to.equal(true);
      });
    });
  });
});
