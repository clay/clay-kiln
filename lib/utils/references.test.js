import _ from 'lodash';
import * as lib from './references';

// note: all tests are doubled, so we can maintain both amphora 4.x (/components)
// and amphora 5.x (/_components) compatibility

describe('references', () => {
  describe('isComponent', () => {
    const fn = lib.isComponent;

    it('returns true if component reference', () => {
      expect(fn('domain.com/components/foo')).to.equal(true);
      expect(fn('domain.com/_components/foo')).to.equal(true);
    });

    it('returns true if component instance reference', () => {
      expect(fn('domain.com/components/foo/instances/bar')).to.equal(true);
      expect(fn('domain.com/_components/foo/instances/bar')).to.equal(true);
    });

    it('returns false if non-component reference', () => {
      expect(fn('domain.com/users/foo')).to.equal(false);
      expect(fn('domain.com/pages/foo')).to.equal(false);
      expect(fn('domain.com/_users/foo')).to.equal(false);
      expect(fn('domain.com/_pages/foo')).to.equal(false);
    });
  });

  describe('isDefaultComponent', () => {
    const fn = lib.isDefaultComponent;

    it('returns true if default component reference', () => {
      expect(fn('domain.com/components/foo')).to.equal(true);
      expect(fn('domain.com/_components/foo')).to.equal(true);
    });

    it('returns false if component instance reference', () => {
      expect(fn('domain.com/components/foo/instances/bar')).to.equal(false);
      expect(fn('domain.com/_components/foo/instances/bar')).to.equal(false);
    });

    it('returns false if non-component reference', () => {
      expect(fn('domain.com/users/foo')).to.equal(false);
      expect(fn('domain.com/pages/foo')).to.equal(false);
      expect(fn('domain.com/_users/foo')).to.equal(false);
      expect(fn('domain.com/_pages/foo')).to.equal(false);
    });
  });

  describe('getComponentName', () => {
    const fn = lib.getComponentName;

    it('gets name from default uri', function () {
      expect(fn('/components/base')).to.equal('base');
      expect(fn('/_components/base')).to.equal('base');
    });

    it('gets name from instance uri', function () {
      expect(fn('/components/base/instances/0')).to.equal('base');
      expect(fn('/_components/base/instances/0')).to.equal('base');
    });

    it('gets name from versioned uri', function () {
      expect(fn('/components/base/instances/0@published')).to.equal('base');
      expect(fn('/_components/base/instances/0@published')).to.equal('base');
    });

    it('gets name from uri with extension', function () {
      expect(fn('/components/base.html')).to.equal('base');
      expect(fn('/components/base.json')).to.equal('base');
      expect(fn('/_components/base.html')).to.equal('base');
      expect(fn('/_components/base.json')).to.equal('base');
    });

    it('gets name from full uri', function () {
      expect(fn('nymag.com/press/components/base/instances/foobarbaz@published')).to.equal('base');
      expect(fn('nymag.com/press/_components/base/instances/foobarbaz@published')).to.equal('base');
    });
  });

  describe('getComponentInstance', () => {
    const fn = lib.getComponentInstance;

    it('gets instance from uri', function () {
      expect(fn('/components/base/instances/0')).to.equal('0');
      expect(fn('/_components/base/instances/0')).to.equal('0');
    });

    it('gets instance from uri with extension', function () {
      expect(fn('/components/base/instances/0.html')).to.equal('0');
      expect(fn('/_components/base/instances/0.html')).to.equal('0');
    });

    it('gets instance from uri with version', function () {
      expect(fn('/components/base/instances/0@published')).to.equal('0');
      expect(fn('/_components/base/instances/0@published')).to.equal('0');
    });

    it('gets instance from full uri', function () {
      expect(fn('nymag.com/press/components/base/instances/foobarbaz@published')).to.equal('foobarbaz');
      expect(fn('nymag.com/press/_components/base/instances/foobarbaz@published')).to.equal('foobarbaz');
    });

    it('CANNOT get instance from default uri', function () {
      expect(fn('/components/base')).to.not.equal('0');
      expect(fn('/_components/base')).to.not.equal('0');
    });
  });

  describe('getComponentVersion', () => {
    const fn = lib.getComponentVersion;

    it('gets version from instance uri', () => {
      expect(fn('/components/foo/instances/bar@published')).to.equal('published');
      expect(fn('/_components/foo/instances/bar@published')).to.equal('published');
    });

    it('gets version from default uri', () => {
      expect(fn('/components/base@published')).to.equal('published');
      expect(fn('/_components/base@published')).to.equal('published');
    });

    it('returns null if no version', () => {
      expect(fn('/components/foo/instances/bar')).to.equal(null);
      expect(fn('/components/base')).to.equal(null);
      expect(fn('/_components/foo/instances/bar')).to.equal(null);
      expect(fn('/_components/base')).to.equal(null);
    });
  });

  describe('replaceVersion', () => {
    const fn = lib.replaceVersion;

    it('adds version to base', function () {
      expect(fn('domain.com/pages/foo', 'bar')).to.equal('domain.com/pages/foo@bar');
      expect(fn('domain.com/_pages/foo', 'bar')).to.equal('domain.com/_pages/foo@bar');
    });

    it('replaces version', function () {
      expect(fn('domain.com/pages/foo@bar', 'baz')).to.equal('domain.com/pages/foo@baz');
      expect(fn('domain.com/_pages/foo@bar', 'baz')).to.equal('domain.com/_pages/foo@baz');
    });

    it('removes version', function () {
      expect(fn('domain.com/pages/foo@bar')).to.equal('domain.com/pages/foo');
      expect(fn('domain.com/_pages/foo@bar')).to.equal('domain.com/_pages/foo');
    });

    it('throws if url is not a string', () => {
      const result = () => fn(1);

      expect(result).to.throw('Uri must be a string, not number');
    });
  });

  describe('getComponentByNameAndInstance', () => {
    const fn = lib.getComponentByNameAndInstance;

    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(_, 'get').returns('domain.com');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('returns object w/ uri if no component found', () => {
      expect(fn('not-found', 'not-found')).to.eql({ uri: 'domain.com/components/not-found/instances/not-found', el: null });
    });

    it('finds components in the dom', () => {
      const uri = 'domain.com/components/found-instance/instances/1',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn('found-instance', '1')).to.eql({ uri, el });
    });

    it('does NOT find default component instances', () => {
      // todo: we should support this
      const uri = 'domain.com/components/not-found',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn('not-found')).to.equal(null);
    });
  });
});
