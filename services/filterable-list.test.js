var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./filterable-list'),
  ds = require('dollar-slice'),
  tpl = require('./tpl'),
  dom = require('@nymag/dom'),
  filterableListController = require('../controllers/filterable-list');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(ds);
      sandbox.stub(filterableListController);
      sandbox.stub(tpl, 'get');
      tpl.get.withArgs('.filtered-input-template').returns(dom.create('<input class="filtered-input" />'));
      tpl.get.withArgs('.filtered-items-template').returns(dom.create('<div><ul class="filtered-items"></div>')); // wrapper divs to simulate doc fragments
      tpl.get.withArgs('.filtered-item-template').returns(dom.create('<div><li class="filtered-item"></div>')); // wrapper divs to simulate doc fragments
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
    });
  });
});
