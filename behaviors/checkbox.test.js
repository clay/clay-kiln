var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')(),
  lib = require('./checkbox'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    it('creates a label containing a checkbox with rivets attributes', function () {
      var label = lib(fixture).el,
        input = label.querySelector('input[type="checkbox"]');

      expect(label.tagName).to.eql('LABEL');
      expect(input).not.to.be.null;
      expect(input.getAttribute('rv-field')).to.eql('foo');
      expect(input.getAttribute('rv-checked')).to.eql('foo.data.value');
    });

  });
});
