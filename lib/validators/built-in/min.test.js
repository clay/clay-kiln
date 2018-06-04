import * as lib from './min';

describe('validators: min', () => {
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

    test('passes if no fields with min', () => {
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

    test('passes if text field has more characters than length', () => {
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
                  min: 2
                }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if text field has same number of characters as length', () => {
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
                  min: 5
                }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if cleaned html has more characters than length', () => {
      expect(fn({
        components: {
          [uri]: { a: '<span>h<strong>ell</strong>o</span>' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: {
                  min: 4
                }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('passes if component list has more components than length', () => {
      expect(fn({
        components: {
          [uri]: { a: [{ _ref: 'domain.com/_components/foo' }, { _ref: 'domain.com/_components/bar' }] }
        },
        schemas: {
          [name]: {
            a: {
              _componentList: {
                validate: {
                  min: 1
                }
              }
            }
          }
        }
      })).toEqual([]);
    });

    test('fails if text field has fewer characters than length', () => {
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
                  min: 10
                }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Foo » A',
        preview: 'hello'
      }]);
    });

    test('fails if component list has fewer components than length', () => {
      expect(fn({
        components: {
          [uri]: { a: [{ _ref: 'domain.com/_components/foo' }, { _ref: 'domain.com/_components/bar' }] }
        },
        schemas: {
          [name]: {
            a: {
              _componentList: {
                validate: {
                  min: 3
                }
              }
            }
          }
        }
      })).toEqual([{
        uri,
        location: 'Foo » A'
      }]);
    });
  });
});
