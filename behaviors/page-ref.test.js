var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('@nymag/dom'),
  lib = require('./page-ref.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    it('appends a hidden field and adds URI to binding value', function () {
      var result = lib(fixture),
        input = result.el.firstElementChild; // inside a DocumentFragment

      expect(result.bindings.data.value).to.eql(dom.uri());
      expect(input.tagName).to.eql('INPUT');
      expect(input.type).to.eql('hidden');
      expect(input.className).to.eql('input-text');
      expect(input.getAttribute('rv-field')).to.eql('foo');
      expect(input.getAttribute('rv-value')).to.eql('foo.data.value');
    });

  });
});
