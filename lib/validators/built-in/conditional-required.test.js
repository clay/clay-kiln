import * as lib from './conditional-required';

describe('validators: conditional-required', () => {
  test('has a label', () => expect(lib.label).not.toBe(null));
  test('has a description', () => expect(lib.description).not.toBe(null));
  test('returns errors', () => expect(lib.type).toBe('error'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/_components/foo/instances/bar',
      name = 'foo';

    test('passes if no components', () => {
      expect(fn({})).toEqual([]);
    });

    test('passes if deleted component', () => {
      expect(fn({
        components: {
          [uri]: {}
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

    test('passes if no required fields', () => {
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

    test('passes if required field with data', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: {
                  required: { field: 'a' }
                }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if required field when it isn\'t required', () => {
      expect(fn({
        components: {
          [uri]: { a: null, b: 1 }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: { field: 'b', operator: '>', value: 1 } }
              }
            },
            b: {}
          }
        }
      })).toEqual([]);
    });

    test('fails if required field when it is required', () => {
      expect(fn({
        components: {
          [uri]: { a: '', b: 2 }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: { field: 'b', operator: '>', value: 1 } }
              }
            },
            b: {}
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A',
        preview: '(based on B)'
      }]);
    });
  });
});
