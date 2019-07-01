import * as lib from './references';

describe('references', () => {
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

  describe('getComponentByNameAndInstance', () => {
    const fn = lib.getComponentByNameAndInstance;

    test('returns object w/ uri if no component found', () => {
      expect(fn({ state: { site: { prefix: 'domain.com' } } }, 'not-found', 'not-found')).toEqual({ uri: 'domain.com/_components/not-found/instances/not-found', el: null });
    });

    test('finds components in the dom', () => {
      const uri = 'domain.com/_components/found-instance/instances/1',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn({ state: { site: { prefix: 'domain.com' } } }, 'found-instance', '1')).toEqual({ uri, el });
    });

    test('does NOT find default component instances', () => {
      // todo: we should support this
      const uri = 'domain.com/_components/not-found',
        el = document.createElement('div');

      el.setAttribute('data-uri', uri);
      document.body.appendChild(el);

      expect(fn({ state: { site: { prefix: 'domain.com' } } }, 'not-found')).toBe(null);
    });
  });

  describe('getLayoutNameAndInstance', () => {
    const fn = lib.getLayoutNameAndInstance;

    test('returns generated name, instance, and message', () => {
      expect(fn({
        state: {
          layout: {
            uri: 'domain.com/_layouts/foo-bar/instances/baz'
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
          layout: {
            uri: 'domain.com/_layouts/foo-bar/instances/baz',
            state: {
              title: 'My Cool Layout'
            }
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
          layout: {
            uri: 'domain.com/_layouts/foo-bar/instances/baz',
            state: {
              title: ''
            }
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
