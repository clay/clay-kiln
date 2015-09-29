var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./get-input');

describe(dirname, function () {
  describe(filename, function () {
    describe('isInput', function () {
      var fn = lib[this.title];

      it('returns false if no argument', function () {
        expect(fn()).to.equal(false);
      });

      it('returns true for <input>', function () {
        var el = document.createElement('input');

        expect(fn(el)).to.equal(true);
      });

      it('returns true for <textarea>', function () {
        var el = document.createElement('textarea');

        expect(fn(el)).to.equal(true);
      });

      it('returns true for elements with the .wysiwyg-input class', function () {
        var el = document.createElement('div');

        el.classList.add('wysiwyg-input');

        expect(fn(el)).to.equal(true);
      });
    });
  });
});
