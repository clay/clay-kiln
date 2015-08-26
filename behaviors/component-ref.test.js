var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  stringify = require('../test/stringify'),
  dom = require('../services/dom'),
  lib = require('./component-ref.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {
    var querySelectorClass = 'query-selector',
      anotherComponent = dom.create('<div class="' + querySelectorClass + '" data-uri="site.com/path/components/x/instances/0"></div>');

    beforeEach(function () {
      document.body.appendChild(anotherComponent);
    });

    afterEach(function () {
      document.body.removeChild(anotherComponent);
    });

    it('appends a hidden field', function () {
      var result = lib(fixture, {selector: '.' + querySelectorClass});

      expect(stringify(result.el)).to.eql('<input type="hidden" class="input-text" rv-field="foo" rv-value="foo.data.value">');
    });

  });
});
