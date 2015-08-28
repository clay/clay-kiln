var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  lib = require('./description.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    fixture.el.appendChild(document.createElement('INPUT')); // Add an input to the el.

    it('prepends description to input', function () {
      var result = lib(fixture, {value: 'Description'}),
        description = result.el.querySelector('p.label-description'),
        nextSibling = description.nextElementSibling;

      expect(description.innerText).to.eql('Description');
      expect(nextSibling.tagName).to.eql('INPUT');
    });

  });
});
