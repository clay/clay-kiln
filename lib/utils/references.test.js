import * as lib from './references';

describe('references', () => {
  describe('isComponent', () => {
    const fn = lib.isComponent;

    test('returns true if component reference', () => {
      expect(fn('domain.com/_components/foo')).toBe(true);
    });

    test('returns true if component instance reference', () => {
      expect(fn('domain.com/_components/foo/instances/bar')).toBe(true);
    });

    test('returns false if non-component reference', () => {
      expect(fn('domain.com/_users/foo')).toBe(false);
      expect(fn('domain.com/_pages/foo')).toBe(false);
    });
  });

  describe('isDefaultComponent', () => {
    const fn = lib.isDefaultComponent;

    test('returns true if default component reference', () => {
      expect(fn('domain.com/_components/foo')).toBe(true);
    });

    test('returns false if component instance reference', () => {
      expect(fn('domain.com/_components/foo/instances/bar')).toBe(false);
    });

    test('returns false if non-component reference', () => {
      expect(fn('domain.com/_users/foo')).toBe(false);
      expect(fn('domain.com/_pages/foo')).toBe(false);
    });
  });

  describe('getComponentName', () => {
    const fn = lib.getComponentName;

    test('gets name from default uri', () => {
      expect(fn('/_components/base')).toBe('base');
    });

    test('gets name from instance uri', () => {
      expect(fn('/_components/base/instances/0')).toBe('base');
    });

    test('gets name from versioned uri', () => {
      expect(fn('/_components/base/instances/0@published')).toBe('base');
    });

    test('gets name from uri with extension', () => {
      expect(fn('/_components/base.html')).toBe('base');
      expect(fn('/_components/base.json')).toBe('base');
    });

    test('gets name from full uri', () => {
      expect(fn('nymag.com/press/_components/base/instances/foobarbaz@published')).toBe('base');
    });
  });

  describe('getComponentInstance', () => {
    const fn = lib.getComponentInstance;

    test('gets instance from uri', () => {
      expect(fn('/_components/base/instances/0')).toBe('0');
    });

    test('gets instance from uri with extension', () => {
      expect(fn('/_components/base/instances/0.html')).toBe('0');
    });

    test('gets instance from uri with version', () => {
      expect(fn('/_components/base/instances/0@published')).toBe('0');
    });

    test('gets instance from full uri', () => {
      expect(fn('nymag.com/press/_components/base/instances/foobarbaz@published')).toBe('foobarbaz');
    });

    test('CANNOT get instance from default uri', () => {
      expect(fn('/_components/base')).not.toBe('0');
    });
  });

  describe('getComponentVersion', () => {
    const fn = lib.getComponentVersion;

    test('gets version from instance uri', () => {
      expect(fn('/_components/foo/instances/bar@published')).toBe('published');
    });

    test('gets version from default uri', () => {
      expect(fn('/_components/base@published')).toBe('published');
    });

    test('returns null if no version', () => {
      expect(fn('/_components/foo/instances/bar')).toBe(null);
      expect(fn('/_components/base')).toBe(null);
    });
  });

  describe('replaceVersion', () => {
    const fn = lib.replaceVersion;

    test('adds version to base', () => {
      expect(fn('domain.com/_pages/foo', 'bar')).toBe('domain.com/_pages/foo@bar');
    });

    test('replaces version', () => {
      expect(fn('domain.com/_pages/foo@bar', 'baz')).toBe('domain.com/_pages/foo@baz');
    });

    test('removes version', () => {
      expect(fn('domain.com/_pages/foo@bar')).toBe('domain.com/_pages/foo');
    });

    test('throws if url is not a string', () => {
      const result = () => fn(1);

      expect(result).toThrow('Uri must be a string, not number');
    });
  });

  describe('getComponentByNameAndInstance', () => {
    const fn = lib.getComponentByNameAndInstance;

    test('returns object w/ uri if no component found', () => {
      expect(fn({ state: { site: { prefix: 'domain.com' }}}, 'not-found', 'not-found')).toEqual({ uri: 'domain.com/_components/not-found/instances/not-found', el: null });
    });

    test('finds components in the dom', () => {
      const uri = 'domain.com/_components/found-instance/instances/1',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn({ state: { site: { prefix: 'domain.com' }}}, 'found-instance', '1')).toEqual({ uri, el });
    });

    test('does NOT find default component instances', () => {
      // todo: we should support this
      const uri = 'domain.com/_components/not-found',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn({ state: { site: { prefix: 'domain.com' }}}, 'not-found')).toBe(null);
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
      })).toEqual({
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
      })).toEqual({
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
      })).toEqual({
        name: 'Foo Bar',
        instance: 'Baz',
        message: 'You are currently editing "Baz (Foo Bar)". Changes you make will be reflected on all pages that use this layout.'
      });
    });
  });
});
