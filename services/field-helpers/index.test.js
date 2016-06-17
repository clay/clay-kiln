var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./index');

describe(dirname, function () {
  describe(filename, function () {
    describe('getInput', function () {
      var fn = lib[this.title],
        formEl;

      beforeEach(function () {
        formEl = document.createElement('div');
      });

      it('finds checkbox groups', function () {
        var el = document.createElement('div');

        el.classList.add('checkbox-group');
        formEl.appendChild(el);
        expect(fn(formEl)).to.equal(el);
      });

      it('finds inputs', function () {
        var input = document.createElement('input');

        formEl.appendChild(input);
        expect(fn(formEl)).to.equal(input);
      });

      it('finds textareas', function () {
        var el = document.createElement('textarea');

        formEl.appendChild(el);
        expect(fn(formEl)).to.equal(el);
      });

      it('finds wysiwyg inputs', function () {
        var el = document.createElement('p');

        el.classList.add('wysiwyg-input');
        formEl.appendChild(el);
        expect(fn(formEl)).to.equal(el);
      });
    });

    describe('getField', function () {
      var fn = lib[this.title],
        formEl;

      beforeEach(function () {
        formEl = document.createElement('div');
      });

      it('finds the editable part of a field', function () {
        var el = document.createElement('div');

        el.setAttribute('rv-field', 'foo');

        formEl.appendChild(el);
        expect(fn(formEl)).to.equal(el);
      });
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
    });
  });
});
