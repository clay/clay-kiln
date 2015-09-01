var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({ value: 'foobar'}),
  dom = require('../services/dom'),
  lib = require('./url.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    var args = {
      required: true,
      placeholder: 'abc'
    };

    it('replaces the result.el', function () { // We could call this a "root" behavior
      var result,
        elBefore = dom.create(`<div class="el-before"></div>`);

      fixture.el = elBefore;
      result = lib(fixture, args);
      expect(result.el.querySelector('.el-before')).to.eql.null;
    });

    it('is wrapped by label', function () {
      expect(lib(fixture, args).el.tagName).to.eql('LABEL');
    });

    it('has URL input', function () {
      expect(lib(fixture, args).el.querySelector('input[type="url"]')).to.not.be.null;
    });

    it('has attributes for rivets', function () {
      var input = lib(fixture, args).el.querySelector('input');

      expect(input.getAttribute('rv-field')).to.eql('foo');
      expect(input.getAttribute('rv-required')).to.eql('foo.required');
      expect(input.getAttribute('rv-placeholder')).to.eql('foo.placeholder');
      expect(input.getAttribute('rv-value')).to.eql('foo.data.value');
    });

    it('has bindings', function () {
      var bindings = lib(fixture, args).bindings;

      expect(bindings.required).to.not.be.undefined;
      expect(bindings.placeholder).to.not.be.undefined;
    });

  });
});
