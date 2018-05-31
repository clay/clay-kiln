import * as lib from './pattern';

describe('validators: pattern', () => {
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

    test('passes if no pattern fields', () => {
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

    test('passes if pattern field that matches', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { pattern: '\\w{5}' }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if pattern field with empty string', () => {
      expect(fn({
        components: {
          [uri]: { a: '' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { pattern: '\\w{5}', patternMessage: 'Please write 5 letters' }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if pattern field with null value', () => {
      expect(fn({
        components: {
          [uri]: { a: null }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { pattern: '\\w{5}', patternMessage: 'Please write 5 letters' }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if pattern field with undefined value', () => {
      expect(fn({
        components: {
          [uri]: { a: undefined }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { pattern: '\\w{5}', patternMessage: 'Please write 5 letters' }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if pattern field not defined in the data', () => {
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
                validate: { pattern: '\\w{5}', patternMessage: 'Please write 5 letters' }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('fails if pattern field that does not match', () => {
      expect(fn({
        components: {
          [uri]: { a: 'foo' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { pattern: '\\w{5}', patternMessage: 'Please write 5 letters' }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A',
        preview: 'Please write 5 letters'
      }]);
    });

    test('does not set preview text if patternMessage not found', () => {
      expect(fn({
        components: {
          [uri]: {
            a: 'foo'
          }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { pattern: '\\w{5}' }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A',
        preview: undefined
      }]);
    });
  });
});
