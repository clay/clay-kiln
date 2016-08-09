var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./safe-attribute'); // static-analysis means this must be string, not ('./' + filename);

describe(dirname, function () {
  describe(filename, function () {
    var el;

    beforeEach(function () {
      el = document.createElement('div');
    });

    describe('writeObjectAsAttr', function () {
      var fn = lib[this.title];

      it('converts object to html string with attribute and value', function () {
        expect(fn('data-something', {a: 'value \'is\' good.'})).to.equal('data-something=\'{"a":"value \\\'is\\\' good."}\'');
      });
    });

    describe('readAttrObject', function () {
      var fn = lib[this.title];

      it('gets string from data-attribute and converts to object', function () {
        el.setAttribute('data-something', '{"a":"value \\\'is\\\' good."}');
        expect(fn(el, 'data-something')).to.deep.equal({a: 'value \'is\' good.'});
      });
    });

  });
});
