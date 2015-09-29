var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./index');

describe(dirname, function () {
  describe(filename, function () {
    describe('add', function () {
      var fn = lib[this.title];

      it('adds things to the global validators', function () {
        fn('foo');
        expect(window.kiln.validators).to.be.an('array');
        expect(window.kiln.validators[0]).to.equal('foo');
      });
    });
  });
});
