var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  lib = require('./description.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    it('fails if no input', function () {
      expect(function () {
        lib(fixture);
      }).to.throw(Error);
    });

    it('prepends description to input', function () {
      var result, description, nextSibling;

      // Add an input el.
      fixture.el.appendChild(document.createElement('INPUT'));
      result = lib(fixture, {value: 'Description'});
      description = result.el.querySelector('p.label-description');
      nextSibling = description.nextElementSibling;

      expect(description.innerText).to.eql('Description');
      expect(nextSibling.tagName).to.eql('INPUT');
    });

  });
});
