var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({ value: 'foobar'}),
  dom = require('../services/dom'),
  lib = require('./text.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    var args = {
      required: true,
      pattern: /\S/,
      minLength: 10,
      maxLength: 20,
      placeholder: 'abc'
    };

    it('replaces the result.el', function () { // Is this good?
      var result,
        elBefore = dom.create(`<div class="el-before"></div>`);

      fixture.el = elBefore;
      result = lib(fixture, {});
      expect(result.el.querySelector('.el-before')).to.eql.null;
    });

    it('is wrapped by label', function () {
      expect(lib(fixture, args).el.tagName).to.eql('LABEL');
    });

    it('has text input', function () {
      expect(lib(fixture, args).el.querySelector('input[type="text"]')).to.not.be.null;
    });

    it('has input attributes', function () {
      var input = lib(fixture, args).el.querySelector('input');

      expect(input.getAttribute('rv-field')).to.eql('foo');
      expect(input.getAttribute('rv-required')).to.eql('foo.required');
      expect(input.getAttribute('rv-pattern')).to.eql('foo.pattern');
      expect(input.getAttribute('rv-minLength')).to.eql('foo.minLength');
      expect(input.getAttribute('rv-maxLength')).to.eql('foo.maxLength');
      expect(input.getAttribute('rv-placeholder')).to.eql('foo.placeholder');
      expect(input.getAttribute('rv-value')).to.eql('foo.data.value');
    });

    it('has bindings', function () {
      var bindings = lib(fixture, args).bindings;

      expect(bindings).to.contain(args);
    });

  });
});
