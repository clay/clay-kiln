const dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./invisible-list'),
  dom = require('@nymag/dom'),
  edit = require('../edit'),
  _ = require('lodash');

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

    describe('getComponentsInList', function () {
      const fn = lib[this.title];

      it('finds components in a specfied list', function () {
        const id1 = 'domain.com/components/foo/instances/1',
          id2 = 'domain.com/components/bar/instances/2',
          listEl = dom.create(`<div data-editable="foo">
            <div class="component-list-inner">
              <span data-uri="${id1}"></span>
              <span data-uri="${id2}"></span>
            </div>
          </div>`);

        expect(fn(listEl)).to.deep.equal([{
          id: id1,
          title: 'Foo'
        }, {
          id: id2,
          title: 'Bar'
        }]);
      });
    });

    describe('removeComponentFromList', function () {
      const fn = lib[this.title];

      it('removes component from a specfied list', function () {
        const id1 = 'domain.com/components/foo/instances/1',
          id2 = 'domain.com/components/bar/instances/2',
          listEl = dom.create(`<div data-editable="foo">
            <div class="component-list-inner">
              <span data-uri="${id1}"></span>
              <span data-uri="${id2}"></span>
            </div>
          </div>`),
          itemsEl = dom.create('<ul><li></li></ul>');

        function expectNoChildren() {
          expect(itemsEl.children.length).to.equal(0);
        }

        document.body.appendChild(listEl);
        edit.removeFromParentList.returns(Promise.resolve());
        return fn('fakeLayout', 'fakePath')(id1, itemsEl.firstElementChild).then(expectNoChildren);
      });
    });

    describe('saveNewOrder', function () {
      const fn = lib[this.title];

      it('finds new order of components and saves it', function () {
        const id1 = 'domain.com/components/foo/instances/1',
          id2 = 'domain.com/components/bar/instances/2',
          listEl = dom.create(`<div data-editable="foo">
            <div class="component-list-inner">
              <span data-uri="${id1}"></span>
              <span data-uri="${id2}"></span>
            </div>
          </div>`);

        function expectSave() {
          expect(edit.save.calledWith({ foo: [{ _ref: id1 }, { _ref: id2 }]})).to.equal(true);
        }

        document.body.appendChild(listEl);
        edit.save.returns(Promise.resolve());
        return fn('foo', listEl, { foo: [{ _ref: id1 }, { _ref: id2 }]}).then(expectSave);
      });
    });

    describe('updateOrder', function () {
      const fn = lib[this.title];

      it('moves component to the beginning of list', function () {
        const id1 = 'domain.com/components/foo/instances/1',
          id2 = 'domain.com/components/bar/instances/2',
          listEl = dom.create(`<div data-editable="foo">
            <div class="component-list-inner">
              <span data-uri="${id1}"></span>
              <span data-uri="${id2}"></span>
            </div>
          </div>`);

        function getAttribute(el) {
          return el.getAttribute('data-uri');
        }

        function expectOrder() {
          expect(_.map(listEl.firstElementChild.children, getAttribute)).to.deep.equal([id2, id1]);
        }

        document.body.appendChild(listEl);
        edit.save.returns(Promise.resolve());
        return fn('foo', listEl, {})(id2, 0).then(expectOrder);
      });

      it('moves component to the end of list', function () {
        const id1 = 'domain.com/components/foo/instances/1',
          id2 = 'domain.com/components/bar/instances/2',
          listEl = dom.create(`<div data-editable="foo">
            <div class="component-list-inner">
              <span data-uri="${id1}"></span>
              <span data-uri="${id2}"></span>
            </div>
          </div>`);

        function getAttribute(el) {
          return el.getAttribute('data-uri');
        }

        function expectOrder() {
          expect(_.map(listEl.firstElementChild.children, getAttribute)).to.deep.equal([id2, id1]);
        }

        document.body.appendChild(listEl);
        edit.save.returns(Promise.resolve());
        return fn('foo', listEl, {})(id1, 2).then(expectOrder);
      });
    });
  });
});
