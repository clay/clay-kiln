import * as lib from './tk';

describe('validators: tk', () => {
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

    test('passes if no fields with text', () => {
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

    test('passes if no fields with tk', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
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

    // we don't want to fail validation if links point to stuff like 'http://tktk.gawker.com'
    test('passes if tk is in tag attributes', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="http://tktk.gawker.com">some text</a>' }
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

    test('passes if tk is in a uri', () => {
      expect(fn({
        components: {
          [uri]: { a: 'tktk.gawker.com' }
        }
      })).toEqual([]);

      // passes classic amphora-style refs
      expect(fn({
        components: {
          [uri]: { a: 'host/components/whatever/instances/000tk00' }
        }
      })).toEqual([]);

      // passes amphora-style refs
      expect(fn({
        components: {
          [uri]: { a: 'host/_components/whatever/instances/000tk00' }
        }
      })).toEqual([]);
    });

    test('fails if field with tk', () => {
      expect(fn({
        components: {
          [uri]: { a: 'foo tk bar' }
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
        preview: 'foo tk bar'
      }]);

      // fails tk at the end of a sentence
      expect(fn({
        components: {
          [uri]: { a: 'end of sentence tk. Start of sentence' }
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      }).length).toBe(1);
    });
  });
});
