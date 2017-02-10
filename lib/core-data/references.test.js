import * as lib from './references';

describe('references', () => {
  describe('isComponent', () => {
    const fn = lib.isComponent;

    it('returns true if component reference', () => {
      expect(fn('domain.com/components/foo')).to.equal(true);
    });

    it('returns true if component instance reference', () => {
      expect(fn('domain.com/components/foo/instances/bar')).to.equal(true);
    });

    it('returns false if non-component reference', () => {
      expect(fn('domain.com/users/foo')).to.equal(false);
      expect(fn('domain.com/pages/foo')).to.equal(false);
    });
  });

  describe('getComponentName', () => {
    const fn = lib.getComponentName;

    it('gets name from default uri', function () {
      expect(fn('/components/base')).to.equal('base');
    });

    it('gets name from instance uri', function () {
      expect(fn('/components/base/instances/0')).to.equal('base');
    });

    it('gets name from versioned uri', function () {
      expect(fn('/components/base/instances/0@published')).to.equal('base');
    });

    it('gets name from uri with extension', function () {
      expect(fn('/components/base.html')).to.equal('base');
      expect(fn('/components/base.json')).to.equal('base');
    });

    it('gets name from full uri', function () {
      expect(fn('nymag.com/press/components/base/instances/foobarbaz@published')).to.equal('base');
    });
  });

  describe('getComponentInstance', () => {
    const fn = lib.getComponentInstance;

    it('gets instance from uri', function () {
      expect(fn('/components/base/instances/0')).to.equal('0');
    });

    it('gets instance from uri with extension', function () {
      expect(fn('/components/base/instances/0.html')).to.equal('0');
    });

    it('gets instance from uri with version', function () {
      expect(fn('/components/base/instances/0@published')).to.equal('0');
    });

    it('gets instance from full uri', function () {
      expect(fn('nymag.com/press/components/base/instances/foobarbaz@published')).to.equal('foobarbaz');
    });

    it('CANNOT get instance from default uri', function () {
      expect(fn('/components/base')).to.not.equal('0');
    });
  });
});
