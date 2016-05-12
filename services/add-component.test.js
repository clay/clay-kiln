var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./add-component'),
  dom = require('@nymag/dom'),
  edit = require('./edit'),
  render = require('./render'),
  progress = require('./progress'),
  focus = require('../decorators/focus');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(edit);
      sandbox.stub(render);
      sandbox.stub(progress);
      sandbox.stub(focus);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('creates component and adds it at the end', function () {
      var pane = dom.create('<div class="pane"></div>');

      document.body.appendChild(pane);
      // stub stuff
      edit.createComponent.returns(Promise.resolve({
        _ref: 'newRef'
      }));
      edit.addToParentList.returns(Promise.resolve(dom.create('<div class="new-component"></div>')));
      lib(pane, { field: null, ref: null }, 'fakeName').then(function () {
        expect(dom.find(pane.previousElementSibling, '.new-component')).to.not.equal(null);
      });
    });

    describe('getRemovablePlaceholder', function () {
      var fn = lib[this.title];

      it('does nothing if no parent found', function () {
        expect(fn({
          ref: 'fakeParentPlaceholder1',
          path: 'foo'
        })).to.equal(null);
      });
      it('does nothing if no component list found in parent', function () {
        var parent = dom.create('<section data-uri="fakeParentPlaceholder2"></section>');

        document.body.appendChild(parent);
        expect(fn({
          ref: 'fakeParentPlaceholder2',
          path: 'foo'
        })).to.equal(null);
      });
      it('does nothing if no wrapper div found in list', function () {
        var parent = dom.create(`<section data-uri="fakeParentPlaceholder3">
          <div data-editable="foo"></div>
        </section>`);

        document.body.appendChild(parent);
        expect(fn({
          ref: 'fakeParentPlaceholder3',
          path: 'foo'
        })).to.equal(null);
      });
      it('does nothing if no placeholder found in wrapper div', function () {
        var parent = dom.create(`<section data-uri="fakeParentPlaceholder4">
          <div data-editable="foo">
            <div></div>
          </div>
        </section>`);

        document.body.appendChild(parent);
        expect(fn({
          ref: 'fakeParentPlaceholder4',
          path: 'foo'
        })).to.equal(null);
      });
      it('does nothing if placeholder is permanent', function () {
        var parent = dom.create(`<section data-uri="fakeParentPlaceholder5">
          <div data-editable="foo">
            <div>
              <div class="kiln-permanent-placeholder"></div>
            </div>
          </div>
        </section>`);

        document.body.appendChild(parent);
        expect(fn({
          ref: 'fakeParentPlaceholder5',
          path: 'foo'
        })).to.equal(null);
      });
      it('removes parent placeholder', function () {
        var parent = dom.create(`<section data-uri="fakeParentPlaceholder6">
          <div data-editable="foo">
            <div>
              <div class="kiln-placeholder"></div>
            </div>
          </div>
        </section>`);

        document.body.appendChild(parent);
        expect(fn({
          ref: 'fakeParentPlaceholder6',
          path: 'foo'
        })).to.not.equal(null);
      });

      it('removes parent placeholder when parent el itself is editable', function () {
        var parent = dom.create(`<section data-uri="fakeParentPlaceholder7" data-editable="foo">
            <div>
              <div class="kiln-placeholder"></div>
            </div>
        </section>`);

        document.body.appendChild(parent);
        expect(fn({
          ref: 'fakeParentPlaceholder7',
          path: 'foo'
        })).to.not.equal(null);
      });
    });
  });
});
