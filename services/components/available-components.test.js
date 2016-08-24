var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./available-components'),
  site = require('../site');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(site, 'get').returns('testSite');
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('works for empty array', function () {
      expect(lib([])).to.deep.equal([]);
    });

    it('works when excluding nothing', function () {
      expect(lib(['foo'])).to.deep.equal(['foo']);
    });

    it('works when excluding empty array', function () {
      expect(lib(['foo'], [])).to.deep.equal(['foo']);
    });

    it('works when excluding stuff', function () {
      expect(lib(['foo'], ['bar'])).to.deep.equal(['foo']);
    });

    it('allows components included on current site', function () {
      expect(lib(['foo (testSite)'])).to.deep.equal(['foo']);
      expect(lib(['foo (testSite, otherSite)'])).to.deep.equal(['foo']);
    });

    it('disallows components not included on current site', function () {
      expect(lib(['foo (otherSite)'])).to.deep.equal([]);
    });

    it('disallows components excluded from current site', function () {
      expect(lib(['foo (not:testSite)'])).to.deep.equal([]);
      expect(lib(['foo (not: testSite)'])).to.deep.equal([]);
    });

    it('disallows components included but also excluded from current site', function () {
      expect(lib(['foo (testSite, otherSite, not:testSite)'])).to.deep.equal([]);
    });
  });
});
