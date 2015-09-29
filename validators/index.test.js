var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./index');

describe(dirname, function () {
  describe(filename, function () {

    it('references the global validators', function () {
      lib.add('bar');
      expect(lib).to.be.an('array');
      expect(lib[0]).to.equal('bar');
    });

    describe('add', function () {
      var fn = lib[this.title];

      it('adds things to the global validators', function () {
        fn('foo');
        expect(window.kiln.validators).to.be.an('array');
        expect(window.kiln.validators[0]).to.equal('bar'); // added from test above. yay globals
        expect(window.kiln.validators[1]).to.equal('foo');
      });
    });
  });
});
