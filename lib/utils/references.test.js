import expect from 'expect';
import _ from 'lodash';
import * as lib from './references';

describe('references', () => {
  describe('isComponent', () => {
    const fn = lib.isComponent;

    test('returns true if component reference', () => {
      expect(fn('domain.com/_components/foo')).to.equal(true);
    });

    test('returns true if component instance reference', () => {
      expect(fn('domain.com/_components/foo/instances/bar')).to.equal(true);
    });

    test('returns false if non-component reference', () => {
      expect(fn('domain.com/_users/foo')).to.equal(false);
      expect(fn('domain.com/_pages/foo')).to.equal(false);
    });
  });

  describe('isDefaultComponent', () => {
    const fn = lib.isDefaultComponent;

    test('returns true if default component reference', () => {
      expect(fn('domain.com/_components/foo')).to.equal(true);
    });

    test('returns false if component instance reference', () => {
      expect(fn('domain.com/_components/foo/instances/bar')).to.equal(false);
    });

    test('returns false if non-component reference', () => {
      expect(fn('domain.com/_users/foo')).to.equal(false);
      expect(fn('domain.com/_pages/foo')).to.equal(false);
    });
  });

  describe('getComponentName', () => {
    const fn = lib.getComponentName;

    test('gets name from default uri', () => {
      expect(fn('/_components/base')).to.equal('base');
    });

    test('gets name from instance uri', () => {
      expect(fn('/_components/base/instances/0')).to.equal('base');
    });

    test('gets name from versioned uri', () => {
      expect(fn('/_components/base/instances/0@published')).to.equal('base');
    });

    test('gets name from uri with extension', () => {
      expect(fn('/_components/base.html')).to.equal('base');
      expect(fn('/_components/base.json')).to.equal('base');
    });

    test('gets name from full uri', () => {
      expect(fn('nymag.com/press/_components/base/instances/foobarbaz@published')).to.equal('base');
    });
  });

  describe('getComponentInstance', () => {
    const fn = lib.getComponentInstance;

    test('gets instance from uri', () => {
      expect(fn('/_components/base/instances/0')).to.equal('0');
    });

    test('gets instance from uri with extension', () => {
      expect(fn('/_components/base/instances/0.html')).to.equal('0');
    });

    test('gets instance from uri with version', () => {
      expect(fn('/_components/base/instances/0@published')).to.equal('0');
    });

    test('gets instance from full uri', () => {
      expect(fn('nymag.com/press/_components/base/instances/foobarbaz@published')).to.equal('foobarbaz');
    });

    test('CANNOT get instance from default uri', () => {
      expect(fn('/_components/base')).to.not.equal('0');
    });
  });

  describe('getComponentVersion', () => {
    const fn = lib.getComponentVersion;

    test('gets version from instance uri', () => {
      expect(fn('/_components/foo/instances/bar@published')).to.equal('published');
    });

    test('gets version from default uri', () => {
      expect(fn('/_components/base@published')).to.equal('published');
    });

    test('returns null if no version', () => {
      expect(fn('/_components/foo/instances/bar')).to.equal(null);
      expect(fn('/_components/base')).to.equal(null);
    });
  });

  describe('replaceVersion', () => {
    const fn = lib.replaceVersion;

    test('adds version to base', () => {
      expect(fn('domain.com/_pages/foo', 'bar')).to.equal('domain.com/_pages/foo@bar');
    });

    test('replaces version', () => {
      expect(fn('domain.com/_pages/foo@bar', 'baz')).to.equal('domain.com/_pages/foo@baz');
    });

    test('removes version', () => {
      expect(fn('domain.com/_pages/foo@bar')).to.equal('domain.com/_pages/foo');
    });

    test('throws if url is not a string', () => {
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

    test('returns object w/ uri if no component found', () => {
      expect(fn('not-found', 'not-found')).to.eql({ uri: 'domain.com/_components/not-found/instances/not-found', el: null });
    });

    test('finds components in the dom', () => {
      const uri = 'domain.com/_components/found-instance/instances/1',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn('found-instance', '1')).to.eql({ uri, el });
    });

    test('does NOT find default component instances', () => {
      // todo: we should support this
      const uri = 'domain.com/_components/not-found',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn('not-found')).to.equal(null);
    });
  });

  describe('getLayoutNameAndInstance', () => {
    const fn = lib.getLayoutNameAndInstance;

    test('returns generated name, instance, and message', () => {
      expect(fn({
        state: {
          page: {
            data: {
              layout: 'domain.com/components/foo-bar/instances/baz'
            }
          }
        }
      })).to.eql({
        name: 'Foo Bar',
        instance: 'Baz',
        message: 'You are currently editing "Baz (Foo Bar)". Changes you make will be reflected on all pages that use this layout.'
      });
    });

    test('uses custom name for the message if it exists in the store', () => {
      expect(fn({
        state: {
          page: {
            data: {
              layout: 'domain.com/components/foo-bar/instances/baz'
            }
          },
          layout: {
            title: 'My Cool Layout'
          }
        }
      })).to.eql({
        name: 'Foo Bar',
        instance: 'Baz',
        message: 'You are currently editing "My Cool Layout". Changes you make will be reflected on all pages that use this layout.'
      });
    });

    test('does not use custom name if it is emptystring', () => {
      expect(fn({
        state: {
          page: {
            data: {
              layout: 'domain.com/components/foo-bar/instances/baz'
            }
          },
          layout: {
            title: ''
          }
        }
      })).to.eql({
        name: 'Foo Bar',
        instance: 'Baz',
        message: 'You are currently editing "Baz (Foo Bar)". Changes you make will be reflected on all pages that use this layout.'
      });
    });
  });
});
