import * as lib from './required';

describe('validators: required', () => {
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

    test('passes if required field with string', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if required field with number', () => {
      expect(fn({
        components: {
          [uri]: { a: 0 }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if required field with boolean', () => {
      expect(fn({
        components: {
          [uri]: { a: false }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('fails if required field with empty string', () => {
      expect(fn({
        components: {
          [uri]: { a: '' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    test('fails if required field with null value', () => {
      expect(fn({
        components: {
          [uri]: { a: null }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    test('fails if required field with undefined value', () => {
      expect(fn({
        components: {
          [uri]: { a: undefined }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    test('fails if required field with empty array', () => {
      expect(fn({
        components: {
          [uri]: { a: [] }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    test('fails if required field with a false checkbox-group', () => {
      expect(fn({
        components: {
          [uri]: {
            a: {
              foo: false,
              bar: false
            }
          }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'checkbox-group',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    test('fails if required field not defined in the data', () => {
      expect(fn({
        components: {
          [uri]: {
            b: true // some other field needs to exist (otherwise we assume the component was deleted)
          }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });
  });
});
