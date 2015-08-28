var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('../services/dom'),
  lib = require('./label.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    it('fails if no .input-label', function () {
      expect(function () {
        lib(fixture);
      }).to.throw(Error);
    });

    it('prepends inner label inside of outer label', function () {
      var result, innerLabel;

      // Add an outer label.
      fixture.el.appendChild(dom.create(`<label class="input-label"><input></label>`));
      result = lib(fixture);
      innerLabel = result.el.querySelector('.input-label').firstElementChild;
      expect(innerLabel.className).to.eql('label-inner');
      expect(innerLabel.textContent).to.eql(fixture.bindings.label);
    });

  });
});
