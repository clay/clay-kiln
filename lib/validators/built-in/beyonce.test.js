import * as lib from './beyonce';

describe('validators: beyonce', () => {
  test('has a label', () => expect(lib.label).not.toBe(null));
  test('has a description', () => expect(lib.description).not.toBe(null));
  test('returns warnings', () => expect(lib.type).toBe('warning'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/_components/foo/instances/bar',
      name = 'foo';

    test('passes if no components', () => {
      expect(fn({})).toEqual([]);
    });

    test('passes if no fields with beyonce', () => {
      expect(fn({
        components: {
          [uri]: { a: null }
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if field with proper spelling', () => {
      expect(fn({
        components: {
          [uri]: { a: 'Beyoncé' }
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      })).toEqual([]);
    });

    // we don't want to fail validation if links point to stuff like 'http://beyonce.com'
    test('passes if misspelling is in tag attributes', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="http://beyonce.com">some text</a>' }
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if input type is url', () => {
      expect(fn({
        components: {
          [uri]: { a: 'http://beyonce.com' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                type: 'url'
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('fails if field without accent', () => {
      expect(fn({
        components: {
          [uri]: { a: 'Beyonce' }
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo',
        preview: 'Beyonce'
      }]);
    });
  });
});
