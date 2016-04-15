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
      var field = document.createElement('INPUT'),
        result, description, nextSibling;

      // add rv-field to the field
      field.setAttribute('rv-field', 'foo');

      // Add an input el.
      fixture.el.appendChild(field);
      result = lib(fixture, {value: 'Description'});
      description = result.el.querySelector('p.label-description');
      nextSibling = description.nextElementSibling;

      expect(description.textContent).to.eql('Description');
      expect(nextSibling.tagName).to.eql('INPUT');
    });

  });
});
