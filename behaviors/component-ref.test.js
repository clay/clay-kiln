var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
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
      var result = lib(fixture, {selector: '.' + querySelectorClass}),
        input = result.el.firstElementChild; // inside a DocumentFragment

      expect(input.tagName).to.eql('INPUT');
      expect(input.type).to.eql('hidden');
      expect(input.getAttribute('rv-field')).to.eql('foo');
      expect(input.getAttribute('rv-value')).to.eql('foo.data.value');
    });

  });
});
