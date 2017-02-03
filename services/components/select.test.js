/* eslint max-nested-callbacks: [1, 5] */
var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  references = require('../references'),
  groups = require('./groups'),
  edit = require('../edit'),
  forms = require('../forms'),
  focus = require('../../decorators/focus'),
  site = require('../site'),
  tpl = require('../tpl'),
  fixture = require('../../test/fixtures/tpl'),
  lib = require('./select'),
  hidden = 'kiln-hide';

describe(dirname, function () {
  describe(filename, function () {
    function stubEditableElement() {
      var node = document.createElement('div');

      node.setAttribute(references.editableAttribute, 'content');
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

      it('adds .selected class when element is component', function () {
        var el = stubEditableComponent();

        fn(el);
        expect(el.classList.contains('selected')).to.equal(true);
      });

      it('adds .selected-parent class to parent component', function () {
        var el = stubEditableElement(),
          parent = stubComponent(),
          component = stubComponent();

        component.appendChild(el);
        parent.appendChild(component);

        fn(el);
        expect(parent.classList.contains('selected-parent')).to.equal(true);
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

      it('removed .selected-parent class from component parent', function () {
        var el = stubEditableElement(),
          component = stubComponent(),
          parent = stubComponent();

        component.appendChild(el);
        parent.appendChild(component);

        lib.select(el);
        fn(); // unselect
        expect(parent.classList.contains('selected-parent')).to.equal(false);
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
      var fn = lib[this.title],
        sandbox;

      beforeEach(function () {
        sandbox = sinon.sandbox.create();
        sandbox.stub(site);
        sandbox.stub(tpl, 'get').returns(fixture['.component-selector-template']());
      });

      afterEach(function () {
        sandbox.restore();
      });

      it('creates a component selector as the component\'s first child element', function () {
        var el = stubComponent();

        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve({}));
        return fn(el, {ref: 'fakeRef'}).then(function (res) {
          expect(res.childNodes[0].classList.contains('component-selector')).to.equal(true);
        });
      });

      it('adds the .component-selector-wrapper class to the component', function () {
        var el = stubComponent();

        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve({}));
        return fn(el, {ref: 'fakeRef'}).then(function (res) {
          expect(res.classList.contains('component-selector-wrapper')).to.equal(true);
        });
      });

      it('adds the component label', function () {
        var el = stubComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'};

        sandbox.stub(references, 'getComponentNameFromReference').returns('fake-name');
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve({}));
        return fn(el, options).then(function (res) {
          expect(res.querySelector('.component-selector .selected-label').textContent).to.equal('Fake Name');
        });
      });

      it('adds the settings button if the component has settings', function () {
        var el = stubComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'};

        // Setup: getSettingsFields returns an array, so we assume there are settings
        sandbox.stub(groups, 'getSettingsFields').returns([1]);
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve({}));
        return fn(el, options).then(function (res) {
          expect(res.querySelector('.component-selector .selected-action-settings').classList.contains(hidden)).to.equal(false);
        });
      });

      it('does not add the settings button if the component has no settings', function () {
        var el = stubComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'};

        // Setup: getSettingsFields returns an empty array, so we assume there are no settings
        sandbox.stub(groups, 'getSettingsFields').returns([]);
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve({}));
        return fn(el, options).then(function (res) {
          expect(res.querySelector('.component-selector .selected-action-settings').classList.contains(hidden)).to.equal(true);
        });
      });

      it('will open settings form if settings button is clicked', function (done) {
        var el = stubComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'};

        el.classList.add('selected');
        sandbox.stub(groups, 'getSettingsFields').returns([1]);
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        sandbox.stub(forms, 'open', sandbox.spy().withArgs('fakeName', document.body));
        sandbox.stub(focus, 'unfocus').returns(Promise.resolve());
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve({}));

        function expectSettings() {
          // the component should still be selected
          expect(el.classList.contains('selected')).to.equal(true);
          // the form should be open
          expect(forms.open.calledOnce).to.equal(true);
          done();
        }

        fn(el, options).then(function (res) {
          // Trigger a click on the settings button
          res.querySelector('.component-selector .selected-action-settings').dispatchEvent(new Event('click'));

          setTimeout(expectSettings, 0);
        });
      });

      it('will select a component when component is clicked', function (done) {
        var el = stubComponent();

        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve({}));
        sandbox.stub(focus, 'unfocus').returns(Promise.resolve());

        function expectSelected(res) {
          // the component should now be selected
          expect(res.classList.contains('selected')).to.equal(true);
          done();
        }

        fn(el, {ref: 'fakeRef'}).then(function (res) {
          // the component shouldn't be selected yet
          expect(res.classList.contains('selected')).to.equal(false);

          // trigger a click on the component
          res.dispatchEvent(new Event('click'));

          setTimeout(expectSelected.bind(null, res), 0);
        });
      });

      it('adds the delete button if the component is within a component list', function () {
        var el = stubComponent(),
          componentList = stubEditableComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'},
          componentListSchema = {content: {}};

        // Setup: there is a component within a component list
        componentListSchema.content[references.componentListProperty] = true; // isComponentList
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve(componentListSchema));
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        componentList.appendChild(el); // el is within component list.

        // Add component bar.
        return fn(el, options).then(function () {
          expect(el.querySelector('.component-selector .selected-action-delete').classList.contains(hidden)).to.equal(false);
        });
      });

      it('does not add the delete button if the component is not within a component list', function () {
        var el = stubComponent(),
          componentList = stubEditableComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'},
          componentListSchema = {content: {}};

        // Setup: there is a component within a component list
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve(componentListSchema)); // is not aComponentList
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        componentList.appendChild(el); // el is within component list.

        // Add component bar.
        return fn(el, options).then(function () {
          expect(el.querySelector('.component-selector .selected-action-delete').classList.contains(hidden)).to.equal(true);
        });
      });

      it('adds the add component button if the component is within a component list', function () {
        var el = stubComponent(),
          componentList = stubEditableComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'},
          componentListSchema = {content: {}};

        // Setup: there is a component within a component list
        componentListSchema.content[references.componentListProperty] = true; // isComponentList
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve(componentListSchema));
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        componentList.appendChild(el); // el is within component list.

        // Add component bar.
        return fn(el, options).then(function (res) {
          expect(res.querySelector('.component-selector .selected-add').classList.contains(hidden)).to.equal(false);
        });
      });

      it('does not add the add component button if the component is not within a component list', function () {
        var el = stubComponent(),
          componentList = stubEditableComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'},
          componentListSchema = {content: {}};

        // Setup: there is a component within a component list
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve(componentListSchema)); // is not a componentList
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        componentList.appendChild(el); // el is within component list.

        // Add component bar.
        return fn(el, options).then(function (res) {
          expect(res.querySelector('.component-selector .selected-add').classList.contains(hidden)).to.equal(true);
        });
      });

      it('adds the replace component button if the component is within a component property', function () {
        var el = stubComponent(),
          componentProp = stubEditableComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'},
          componentPropSchema = {content: {}};

        // Setup: there is a component within a component list
        componentPropSchema.content[references.componentProperty] = true; // isComponentList
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve(componentPropSchema));
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        componentProp.appendChild(el); // el is within component list.

        // Add component bar.
        return fn(el, options).then(function (res) {
          expect(res.querySelector('.component-selector .selected-replace').classList.contains(hidden)).to.equal(false);
        });
      });

      it('does not add the replace component button if the component is not within a component property', function () {
        var el = stubComponent(),
          componentProp = stubEditableComponent(),
          options = {ref: 'fakeRef', data: {}, path: 'fakePath'},
          componentPropSchema = {content: {}};

        // Setup: there is a component within a component list
        sandbox.stub(edit, 'getSchema').returns(Promise.resolve(componentPropSchema)); // is not a componentProp
        sandbox.stub(references, 'getComponentNameFromReference').returns('fakeName');
        componentProp.appendChild(el); // el is within component list.

        // Add component bar.
        return fn(el, options).then(function (res) {
          expect(res.querySelector('.component-selector .selected-replace').classList.contains(hidden)).to.equal(true);
        });
      });
    });
  });
});
