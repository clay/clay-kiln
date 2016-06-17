var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./add-component-handler'),
  dom = require('@nymag/dom');

describe(dirname, function () {
  describe(filename, function () {
    describe('getParentListElement', function () {
      var fn = lib[this.title];

      it('finds list when list is parent el', function () {
        var el = dom.create('<div data-editable="content"></div>');

        expect(fn(el, 'content')).to.equal(el);
      });

      it('finds list inside parent el', function () {
        var el = dom.create('<div><div class="inner" data-editable="content"></div></div>');

        expect(fn(el, 'content')).to.equal(el.querySelector('.inner'));
      });
    });

    describe('getAddableComponents', function () {
      var fn = lib[this.title];

      it('works for empty array', function () {
        expect(fn([])).to.deep.equal([]);
      });

      it('works when excluding nothing', function () {
        expect(fn(['foo'])).to.deep.equal(['foo']);
      });

      it('works when excluding empty array', function () {
        expect(fn(['foo'], [])).to.deep.equal(['foo']);
      });

      it('works when excluding stuff', function () {
        expect(fn(['foo'], ['bar'])).to.deep.equal(['foo']);
      });
    });
  });
});
