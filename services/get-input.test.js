var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./get-input');

describe(dirname, function () {
  describe(filename, function () {
    var formEl;

    beforeEach(function () {
      formEl = document.createElement('div');
    });

    it('finds checkbox groups', function () {
      var el = document.createElement('div');

      el.classList.add('checkbox-group');
      formEl.appendChild(el);
      expect(lib(formEl)).to.equal(el);
    });

    it('finds simple lists BEFORE inputs', function () {
      // note: simple-list contains an input, so we need to match before `input`
      var el = document.createElement('div'),
        input = document.createElement('input');

      el.classList.add('simple-list');
      formEl.appendChild(el);
      formEl.appendChild(input);
      expect(lib(formEl)).to.equal(el);
    });

    it('finds inputs', function () {
      var input = document.createElement('input');

      formEl.appendChild(input);
      expect(lib(formEl)).to.equal(input);
    });

    it('finds textareas', function () {
      var el = document.createElement('textarea');

      formEl.appendChild(el);
      expect(lib(formEl)).to.equal(el);
    });

    it('finds wysiwyg inputs', function () {
      var el = document.createElement('p');

      el.classList.add('wysiwyg-input');
      formEl.appendChild(el);
      expect(lib(formEl)).to.equal(el);
    });

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

      it('returns true for elements with the .simple-list class', function () {
        var el = document.createElement('div');

        el.classList.add('simple-list');

        expect(fn(el)).to.equal(true);
      });
    });
  });
});
