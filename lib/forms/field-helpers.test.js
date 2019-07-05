import * as lib from './field-helpers';

describe('field helpers', () => {
  describe('getFieldData', () => {
    const fn = lib.getFieldData,
      prop = 'foo',
      uri = 'domain.com/_components/abc/instances/def',
      storeWithList = {
        state: {
          ui: {
            currentForm: {
              fields: {
                bar: [{ foo: 'hi' }]
              }
            }
          }
        }
      },
      storeWithForm = {
        state: {
          ui: {
            currentForm: {
              fields: {
                foo: 'hi'
              }
            }
          }
        }
      },
      storeWithComponent = {
        state: {
          components: {
            [uri]: {
              foo: 'hi'
            }
          }
        }
      },
      storeWithoutAnything = {};

    test('returns data from current list item', () => {
      expect(fn(storeWithList, prop, 'bar.0.baz', uri)).toEqual('hi');
    });

    test('returns data from current parent list item', () => {
      expect(fn(storeWithList, prop, 'bar.0.baz.0.qux', uri)).toEqual('hi');
    });

    test('returns data from current form', () => {
      expect(fn(storeWithForm, prop, 'bar', uri)).toEqual('hi');
    });

    test('returns data from current form (even in list)', () => {
      expect(fn(storeWithForm, prop, 'bar.0.baz', uri)).toEqual('hi');
    });

    test('returns data from current form (even in nested list)', () => {
      expect(fn(storeWithForm, prop, 'bar.0.baz.0.qux', uri)).toEqual('hi');
    });

    test('returns data from current component', () => {
      expect(fn(storeWithComponent, prop, 'bar', uri)).toEqual('hi');
    });

    test('returns data from current component (even in list)', () => {
      expect(fn(storeWithComponent, prop, 'bar.0.baz', uri)).toEqual('hi');
    });

    test('returns data from current component (even in nested list)', () => {
      expect(fn(storeWithComponent, prop, 'bar.0.baz.0.qux', uri)).toEqual('hi');
    });

    test('returns undefined if not found anywhere', () => {
      expect(fn(storeWithoutAnything, prop, 'bar.baz', uri)).toBeUndefined();
    });

    test('returns undefined if not found anywhere (even in list)', () => {
      expect(fn(storeWithoutAnything, prop, 'bar.0.baz', uri)).toBeUndefined();
    });
  });

  describe('shouldBeRevealed', () => {
    const fn = lib.shouldBeRevealed;

    test('returns true if no reveal config', () => {
      expect(fn({}, null, 'foo')).toBe(true);
    });

    test('returns true if reveal config matches data and site', () => {
      expect(fn({
        state: {
          site: {
            slug: 'siteone'
          },
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'qux'
              }
            }
          }
        }
      }, {
        field: 'baz',
        value: 'qux',
        sites: 'siteone'
      }, 'name')).toBe(true);
    });

    test('returns false if reveal config matches data but not site', () => {
      expect(fn({
        state: {
          site: {
            slug: 'sitetwo'
          },
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'qux'
              }
            }
          }
        }
      }, {
        field: 'baz',
        value: 'qux',
        sites: 'siteone'
      }, 'name')).toBe(false);
    });

    test('returns false if reveal config matches site but not data', () => {
      expect(fn({
        state: {
          site: {
            slug: 'siteone'
          },
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'quuuuuuuuuuuux'
              }
            }
          }
        }
      }, {
        field: 'baz',
        value: 'qux',
        sites: 'siteone'
      }, 'name')).toBe(false);
    });

    test('returns true if reveal config matches site', () => {
      expect(fn({
        state: {
          site: {
            slug: 'siteone'
          }
        }
      }, {
        sites: 'siteone'
      }, 'name')).toBe(true);
    });

    test('returns false if reveal config does not match site', () => {
      expect(fn({
        state: {
          site: {
            slug: 'sitetwo'
          }
        }
      }, {
        sites: 'siteone'
      }, 'name')).toBe(false);
    });

    test('returns true if reveal config matches data', () => {
      expect(fn({
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'qux'
              }
            }
          }
        }
      }, {
        field: 'baz',
        value: 'qux'
      }, 'name')).toBe(true);
    });

    test('returns true if reveal config matches falsy data', () => {
      expect(fn({
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: false
              }
            }
          }
        }
      }, {
        field: 'baz',
        value: false
      }, 'name')).toBe(true);
    });

    test('returns false if reveal config does not match data', () => {
      expect(fn({
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'quuuuux'
              }
            }
          }
        }
      }, {
        field: 'baz',
        value: 'qux'
      }, 'name')).toBe(false);
    });

    test('returns true if reveal config matches multiple values', () => {
      expect(fn({
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'qux'
              }
            }
          }
        }
      }, {
        field: 'baz',
        values: ['qux', 'quux']
      }, 'name')).toBe(true);
    });

    test('returns false if reveal config does not match multiple values', () => {
      expect(fn({
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'quuuuux'
              }
            }
          }
        }
      }, {
        field: 'baz',
        values: ['qux', 'quux']
      }, 'name')).toBe(false);
    });
  });

  describe('shouldBeRequired', () => {
    const fn = lib.shouldBeRequired;

    test('returns true if require config matches data', () => {
      expect(fn({
        required: {
          field: 'baz',
          value: 'qux'
        }
      }, {
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'qux'
              }
            }
          }
        }
      }, 'name')).toBe(true);
    });

    test('returns true if require config matches falsy data', () => {
      expect(fn({
        required: {
          field: 'baz',
          value: false
        }
      }, {
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: false
              }
            }
          }
        }
      }, 'name')).toBe(true);
    });

    test('returns false if require config does not match data', () => {
      expect(fn({
        required: {
          field: 'baz',
          value: 'qux'
        }
      }, {
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'quuuuux'
              }
            }
          }
        }
      }, 'name')).toBe(false);
    });

    test('returns true if require config matches multiple values', () => {
      expect(fn({
        required: {
          field: 'baz',
          values: ['qux', 'quux']
        }
      }, {
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'qux'
              }
            }
          }
        }
      }, 'name')).toBe(true);
    });

    test('returns false if require config does not match multiple values', () => {
      expect(fn({
        required: {
          field: 'baz',
          values: ['qux', 'quux']
        }
      }, {
        state: {
          ui: {
            currentForm: {
              uri: 'domain.com/_components/foo/instances/bar',
              fields: {
                baz: 'quuuuux'
              }
            }
          }
        }
      }, 'name')).toBe(false);
    });
  });
});
