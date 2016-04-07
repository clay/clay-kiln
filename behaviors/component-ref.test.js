var _ = require('lodash'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('@nymag/dom'),
  lib = require('./component-ref.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {
    var querySelectorClass = 'query-selector',
      anotherComponentUri = 'site.com/path/components/x/instances/0',
      anotherComponent = dom.create('<div class="' + querySelectorClass + '" data-uri="' + anotherComponentUri + '"></div>'),
      commentUri = 'site.com/path/components/y/instances/0',
      comment = document.createComment(' data-uri="' + commentUri + '"');

    beforeEach(function () {
      document.body.appendChild(anotherComponent);
      document.head.appendChild(comment);
    });

    afterEach(function () {
      document.body.removeChild(anotherComponent);
      document.head.removeChild(comment);
    });

    it('appends a hidden field', function () {
      var result = lib(fixture, {selector: '.' + querySelectorClass}),
        input = result.el.firstElementChild; // inside a DocumentFragment

      expect(input.tagName).to.eql('INPUT');
      expect(input.type).to.eql('hidden');
    });

    it('finds component element with selector', function () {
      var result = lib(fixture, {selector: '[data-uri*="/components/x/"]'});

      expect(_.get(result, 'bindings.data')).to.deep.equal([anotherComponentUri]);
    });

    it('finds component element with name', function () {
      var result = lib(fixture, {name: 'x'});

      expect(_.get(result, 'bindings.data')).to.deep.equal([anotherComponentUri]);
    });

    it('finds component comment (in head) with name', function () {
      var result = lib(fixture, {name: 'y'});

      expect(_.get(result, 'bindings.data')).to.deep.equal([commentUri]);
    });
  });
});
