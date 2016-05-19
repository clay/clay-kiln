var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./index');

describe(dirname, function () {
  describe(filename, function () {

    beforeEach(function () {
      // clear validators
      lib.errors = [];
      lib.warnings = [];
    });

    it('references the global validators', function () {
      lib.addError('foo');
      lib.addWarning('bar');
      // both should be arrays
      expect(lib).to.be.an('object');
      expect(lib.errors).to.be.an('array');
      expect(lib.warnings).to.be.an('array');
      expect(lib.errors[0]).to.equal('foo');
      expect(lib.warnings[0]).to.equal('bar');
    });

    describe('addError', function () {
      var fn = lib[this.title];

      it('adds to the global validators', function () {
        expect(window.kiln.validators.errors).to.be.an('array');
        expect(window.kiln.validators.errors.length).to.equal(0);

        fn('foo');

        expect(window.kiln.validators.errors.length).to.equal(1);
        expect(window.kiln.validators.errors[0]).to.equal('foo');
      });
    });

    describe('addWarning', function () {
      var fn = lib[this.title];

      it('adds to the global validators', function () {
        expect(window.kiln.validators.warnings).to.be.an('array');
        expect(window.kiln.validators.warnings.length).to.equal(0);

        fn('foo');

        expect(window.kiln.validators.warnings.length).to.equal(1);
        expect(window.kiln.validators.warnings[0]).to.equal('foo');
      });
    });
  });
});
