var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./filterable-list'),
  ds = require('dollar-slice'),
  tpl = require('./tpl'),
  dom = require('@nymag/dom'),
  _ = require('lodash');

function stubFilterableItemTemplate() {
  // wrapper divs to simulate doc fragments
  return dom.create(`<div><li class="filtered-item">
    <button class="filtered-item-reorder kiln-hide" title="Reorder">=</button>
    <span class="filtered-item-title"></span>
    <button class="filtered-item-settings kiln-hide" title="Settings">*</button>
    <button class="filtered-item-remove kiln-hide" title="Remove">X</button>
  </li></div>`);
}

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(ds);
      sandbox.stub(tpl, 'get');
      tpl.get.withArgs('.filtered-input-template').returns(dom.create('<input class="filtered-input" />'));
      tpl.get.withArgs('.filtered-items-template').returns(dom.create('<div><ul class="filtered-items"></div>')); // wrapper divs to simulate doc fragments
      tpl.get.withArgs('.filtered-item-template').returns(stubFilterableItemTemplate());
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('create', function () {
      var fn = lib[this.title];

      it('throws error if not passed an array as first argument', function () {
        var undef = () => fn(),
          nul = () => fn(null),
          obj = () => fn({}),
          str = () => fn('foo');

        expect(undef).to.throw(Error);
        expect(nul).to.throw(Error);
        expect(obj).to.throw(Error);
        expect(str).to.throw(Error);
      });

      it('throws error if not passed an object (with click function) as second argument', function () {
        var undef = () => fn([]),
          nul = () => fn([], null),
          arr = () => fn([], []),
          str = () => fn([], 'foo'),
          noClick = () => fn([], {});

        expect(undef).to.throw(Error);
        expect(nul).to.throw(Error);
        expect(arr).to.throw(Error);
        expect(str).to.throw(Error);
        expect(noClick).to.throw(Error);
      });

      it('creates a list', function () {
        var el = fn(['foo'], { click: _.noop });

        expect(dom.findAll(el, '.filtered-item').length).to.equal(1);
      });

      it('creates labels for string arrays', function () {
        var el = fn(['foo-bar'], { click: _.noop });

        expect(dom.find(el, '.filtered-item-title').innerHTML).to.equal('Foo Bar');
        expect(dom.find(el, '.filtered-item').getAttribute('data-item-id')).to.equal('foo-bar');
      });

      it('uses title and id of object arrays', function () {
        var el = fn([{ title: 'Foo Bar', id: 'foo-bar' }], { click: _.noop });

        expect(dom.find(el, '.filtered-item-title').innerHTML).to.equal('Foo Bar');
        expect(dom.find(el, '.filtered-item').getAttribute('data-item-id')).to.equal('foo-bar');
      });

      it('allows html in title', function () {
        var el = fn([{ title: 'Foo <em>Bar</em>', id: 'foo-bar' }], { click: _.noop });

        expect(dom.find(el, '.filtered-item-title').innerHTML).to.equal('Foo <em>Bar</em>');
      });

      it('adds remove buttons if options.remove is set', function () {
        var el = fn([{ title: 'Foo <em>Bar</em>', id: 'foo-bar' }], { click: _.noop, remove: _.noop });

        expect(dom.find(el, '.filtered-item-remove').classList.contains('kiln-hide')).to.equal(false);
      });

      it('does not add remove buttons if options.remove is not set', function () {
        var el = fn([{ title: 'Foo <em>Bar</em>', id: 'foo-bar' }], { click: _.noop });

        expect(dom.find(el, '.filtered-item-remove').classList.contains('kiln-hide')).to.equal(true);
      });

      it('adds settings buttons if options.settings is set', function () {
        var el = fn([{ title: 'Foo <em>Bar</em>', id: 'foo-bar' }], { click: _.noop, settings: _.noop });

        expect(dom.find(el, '.filtered-item-settings').classList.contains('kiln-hide')).to.equal(false);
      });

      it('does not add settings buttons if options.settings is not set', function () {
        var el = fn([{ title: 'Foo <em>Bar</em>', id: 'foo-bar' }], { click: _.noop });

        expect(dom.find(el, '.filtered-item-settings').classList.contains('kiln-hide')).to.equal(true);
      });

      it('adds reorder buttons if options.reorder is set', function () {
        var el = fn([{ title: 'Foo <em>Bar</em>', id: 'foo-bar' }], { click: _.noop, reorder: _.noop });

        expect(dom.find(el, '.filtered-item-reorder').classList.contains('kiln-hide')).to.equal(false);
      });
    });
  });
});
