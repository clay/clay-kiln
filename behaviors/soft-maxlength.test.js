var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  lib = require('./soft-maxlength.js'), // static-analysis means this must be string, not `('./' + filename)`
  dom = require('../services/dom'),
  args = { value: '20' },
  inputLongClass = 'input-too-long',
  spanLongClass = 'too-long';

describe(dirname, function () {
  describe(filename, function () {

    it('appends a span', function () {
      expect(lib(fixture, args).el.querySelector('span.soft-maxlength')).to.not.be.null;
    });

    it('stores maxlength and remaining count in attributes', function () {
      var el = lib(fixture, args).el.querySelector('span.soft-maxlength');

      expect(el.getAttribute('data-maxlength')).to.eql(args.value);
      expect(el.getAttribute('rv-remaining')).to.eql(fixture.name + '.data.value');
    });

    it('adds binder', function () {
      expect(lib(fixture, args).binders.remaining).to.not.be.null;
    });

    it('has binder that toggles too-long classes', function () {
      var result, input, span, binder;

      fixture.el = dom.create(`<div><input></div>`);
      result = lib(fixture, args);
      input = result.el.querySelector('input');
      span = result.el.querySelector('span.soft-maxlength');
      binder = result.binders.remaining;

      expect(input.classList.contains(inputLongClass)).to.be.false;
      expect(span.classList.contains(spanLongClass)).to.be.false;

      binder(span, 'Text length more than max characters.');
      expect(input.classList.contains(inputLongClass)).to.be.true;
      expect(span.classList.contains(spanLongClass)).to.be.true;

      binder(span, 'Under limit');
      expect(input.classList.contains(inputLongClass)).to.be.false;
      expect(span.classList.contains(spanLongClass)).to.be.false;
    });

    it('has binder that allows for undefined field', function () {
      var result, input, span, binder;

      fixture.el = dom.create(`<div><input></div>`);
      result = lib(fixture, args);
      input = result.el.querySelector('input');
      span = result.el.querySelector('span.soft-maxlength');
      binder = result.binders.remaining;

      binder(span, undefined);
      expect(input.classList.contains(inputLongClass)).to.be.false;
      expect(span.classList.contains(spanLongClass)).to.be.false;
    });
  });
});
