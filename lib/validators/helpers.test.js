import _ from 'lodash';
import * as lib from './helpers';

function getFirstArg(spy) {
  return _.get(spy, 'mock.calls.0.0');
}

describe('validation helpers', () => {
  describe('forEachComponent', () => {
    const fn = lib.forEachComponent;

    test('does not run function if no components', () => {
      const spy = jest.fn();

      fn(null, spy);
      expect(spy).toHaveBeenCalledTimes(0);
    });

    test(
      'does not run function on components that have been removed from the state',
      () => {
        const spy = jest.fn();

        fn({
          components: {
            a: {},
            b: { a: 'b' }
          }
        }, spy);
        expect(spy).toHaveBeenCalledTimes(1); // only called on b
      }
    );

    test('calls function on each component', () => {
      let aData = { a: 'b' },
        bData = { b: 'c' },
        spy = jest.fn();

      fn({
        components: {
          a: aData,
          b: bData
        }
      }, spy);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0]).toEqual([aData, 'a']);
      expect(spy.mock.calls[1]).toEqual([bData, 'b']);
    });

    test('allows filtering by component', () => {
      let aData = { a: 'b' },
        bData = { b: 'c' },
        spy = jest.fn();

      fn({
        components: {
          'components/a/instances/foo': aData,
          'components/b/instances/foo': bData,
          'components/a': {} // empty data
        }
      }, spy, 'a');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0]).toEqual([aData, 'components/a/instances/foo']);
    });

    test('allows filtering by multiple components', () => {
      let aData = { a: 'b' },
        bData = { b: 'c' },
        cData = { c: 'd' },
        spy = jest.fn();

      fn({
        components: {
          'components/a/instances/foo': aData,
          'components/b/instances/foo': bData,
          'components/c/instances/foo': cData
        }
      }, spy, ['a', 'b']);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0]).toEqual([aData, 'components/a/instances/foo']);
      expect(spy.mock.calls[1]).toEqual([bData, 'components/b/instances/foo']);
    });
  });

  describe('getSchema', () => {
    const fn = lib.getSchema;

    test('throws error if uri passed in as first argument', () => {
      expect(() => fn('foo')).toThrow(Error);
    });

    test('gets schema for component', () => {
      expect(fn({ schemas: { foo: { a: 'b' } } }, 'foo')).toEqual({ a: 'b' });
    });

    test('gets schema for hyphenated-named component', () => {
      expect(fn({ schemas: { 'foo-bar': { a: 'b' } } }, 'foo-bar')).toEqual({ a: 'b' });
    });

    test('gets schema for uri', () => {
      expect(fn({ schemas: { foo: { a: 'b' } } }, 'domain.com/_components/foo/instances/bar')).toEqual({ a: 'b' });
    });
  });

  describe('forEachField', () => {
    const fn = lib.forEachField;

    test('does not call fn for empty component', () => {
      const spy = jest.fn();

      fn({ schemas: { foo: { a: {} } } }, {}, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(0);
    });

    test('does not call fn for empty schema (no fields or metadata)', () => {
      const spy = jest.fn();

      fn({ schemas: { foo: {} } }, { a: 'b' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(0);
    });

    test('does not call fn for metadata', () => {
      const spy = jest.fn();

      // _version, _description, and _devDescription are component metadata
      fn({
        schemas: {
          foo: {
            _version: 1,
            _description: 'some desc',
            _devDescription: 'some desc'
          }
        }
      }, { a: 'b' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(0);
    });

    // component lists

    test('calls fn w/ empty data for component list', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _componentList: true }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _componentList: true },
        validate: undefined
      });
    });

    test('calls fn w/ empty array for component list', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _componentList: true }
          }
        }
      }, { a: [] }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _componentList: true },
        validate: undefined
      });
    });

    test('calls fn w/ data for component list', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _componentList: true }
          }
        }
      }, { a: [{ _ref: 'domain.com/_components/bar' }] }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: ['domain.com/_components/bar'],
        schema: { _componentList: true },
        validate: undefined
      });
    });

    test('calls fn w/ data for page area', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _componentList: { page: true } }
          }
        }
      }, { a: 'a' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: 'a',
        schema: { _componentList: { page: true } },
        validate: undefined
      });
    });

    // component props

    test('calls fn w/ null data for component prop', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _component: true }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'component-prop',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _component: true },
        validate: undefined
      });
    });

    test('calls fn w/ data for component prop', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _component: true }
          }
        }
      }, { a: { _ref: 'domain.com/_components/bar' } }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'component-prop',
        name: 'a',
        path: 'a',
        value: 'domain.com/_components/bar',
        schema: { _component: true },
        validate: undefined
      });
    });

    // non-editable fields

    test('calls fn w/ null data for field w/ empty object in schema', () => {
      const spy = jest.fn();

      // note: these log warnings when they're initially added to the page,
      // because we want developers to add descriptions to their fields
      fn({
        schemas: {
          foo: {
            a: {}
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: {},
        validate: undefined
      });
    });

    test('calls fn w/ null data for non-editable fields', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { help: 'hi' } }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: { help: 'hi' } },
        validate: undefined
      });
    });

    test('calls fn w/ null data for non-editable fields w/ undefined data', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { help: 'hi' } }
          }
        }
      }, { a: undefined }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: { help: 'hi' } },
        validate: undefined
      });
    });

    test('calls fn w/ data for non-editable fields', () => {
      const spy = jest.fn();

      // e.g. if data is generated by model.js or pubsub
      fn({
        schemas: {
          foo: {
            a: { _has: { help: 'hi' } }
          }
        }
      }, { a: 'b' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: 'b',
        schema: { _has: { help: 'hi' } },
        validate: undefined
      });
    });

    test('calls fn w/ null data for editable fields (shorthand syntax)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: 'text' }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: 'text' },
        validate: undefined
      });
    });

    test('calls fn w/ null data for editable fields (longhand syntax)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text' } }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: { input: 'text' } },
        validate: undefined
      });
    });

    test('calls fn w/ data for editable fields (shorthand syntax)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: 'checkbox' }
          }
        }
      }, { a: false }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: false,
        schema: { _has: 'checkbox' },
        validate: undefined
      });
    });

    test('calls fn w/ data for editable fields (longhand syntax)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'checkbox' } }
          }
        }
      }, { a: false }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: false,
        schema: { _has: { input: 'checkbox' } },
        validate: undefined
      });
    });

    test('calls fn w/ data for editable fields (empty string)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text' } }
          }
        }
      }, { a: '' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: '',
        schema: { _has: { input: 'text' } },
        validate: undefined
      });
    });

    test('calls fn w/ data for editable fields (zero)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text', type: 'number' } }
          }
        }
      }, { a: 0 }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: 0,
        schema: { _has: { input: 'text', type: 'number' } },
        validate: undefined
      });
    });

    test('calls fn w/ data for editable fields (boolean)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'checkbox' } }
          }
        }
      }, { a: true }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: true,
        schema: { _has: { input: 'checkbox' } },
        validate: undefined
      });
    });

    test('calls fn w/ data for editable fields (string)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text' } }
          }
        }
      }, { a: 'hi' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: 'hi',
        schema: { _has: { input: 'text' } },
        validate: undefined
      });
    });

    test('calls fn w/ data for editable fields (number)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text', type: 'number' } }
          }
        }
      }, { a: 5 }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: 5,
        schema: { _has: { input: 'text', type: 'number' } },
        validate: undefined
      });
    });

    // complex lists

    test('calls fn w/ empty array for undefined complex-lists', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
    });

    test('calls fn w/ empty array for empty complex-lists', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { a: [] }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(getFirstArg(spy)).toEqual({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
    });

    test('recursively calls fn for complex-lists (null child)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { a: [{}] }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(getFirstArg(spy)).toEqual({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [{}],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
      expect(_.get(spy, 'mock.calls.1.0')).toEqual({
        type: 'editable-field',
        name: 'b',
        path: 'a.0.b',
        value: null,
        schema: { prop: 'b', _has: 'text' },
        validate: undefined
      });
    });

    test('recursively calls fn for complex-lists (children w/ data)', () => {
      const spy = jest.fn();

      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { a: [{ b: 'c' }, { b: 'd' }] }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(getFirstArg(spy)).toEqual({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [{ b: 'c' }, { b: 'd' }],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
      expect(_.get(spy, 'mock.calls.1.0')).toEqual({
        type: 'editable-field',
        name: 'b',
        path: 'a.0.b',
        value: 'c',
        schema: { prop: 'b', _has: 'text' },
        validate: undefined
      });
      expect(_.get(spy, 'mock.calls.2.0')).toEqual({
        type: 'editable-field',
        name: 'b',
        path: 'a.1.b',
        value: 'd',
        schema: { prop: 'b', _has: 'text' },
        validate: undefined
      });
    });

    test('recursively calls fn for complex-lists inside complex-list', () => {
      const spy = jest.fn();

      // [ ಠ Ĺ̯ ಠೃ ] I say, steady on old chum!
      fn({
        schemas: {
          foo: {
            a: {
              _has: {
                input: 'complex-list',
                props: [{
                  prop: 'b',
                  _has: {
                    input: 'complex-list',
                    props: [{
                      prop: 'c',
                      _has: 'text'
                    }]
                  }
                }]
              }
            }
          }
        }
      }, { a: [{ b: [{ c: 'hi' }] }] }, 'foo', spy);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(getFirstArg(spy)).toEqual({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [{ b: [{ c: 'hi' }] }],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: { input: 'complex-list', props: [{ prop: 'c', _has: 'text' }] } }] } },
        validate: undefined
      });
      expect(_.get(spy, 'mock.calls.1.0')).toEqual({
        type: 'complex-list',
        name: 'b',
        path: 'a.0.b',
        value: [{ c: 'hi' }],
        schema: { prop: 'b', _has: { input: 'complex-list', props: [{ prop: 'c', _has: 'text' }] } },
        validate: undefined
      });
      expect(_.get(spy, 'mock.calls.2.0')).toEqual({
        type: 'editable-field',
        name: 'c',
        path: 'a.0.b.0.c',
        value: 'hi',
        schema: { prop: 'c', _has: 'text' },
        validate: undefined
      });
    });
  });

  describe('getPlaintextValue', () => {
    const fn = lib.getPlaintextValue;

    test('passes through strings without formatting', () => {
      expect(fn('hi')).toEqual('hi');
    });

    test('removes formatting from strings', () => {
      expect(fn('<strong>hi</strong>')).toEqual('hi');
    });

    test('decodes html entities', () => {
      expect(fn('&hellip;')).toEqual('…');
    });
  });

  describe('getPreviewText', () => {
    const fn = lib.getPreviewText;

    test('returns the full text if short', () => {
      expect(fn('hello', 0, 0)).toBe('hello');
    });

    test('truncates text', () => {
      expect(fn('O brave new world, that has such people in\'t!', 21, 0)).toBe('… brave new world, that has such people i…');
    });
  });

  describe('shouldBeRequired', () => {
    const fn = lib.shouldBeRequired;

    test('compares root fields', () => {
      expect(fn({
        path: 'a',
        validate: {
          required: {
            field: 'b',
            operator: 'empty'
          }
        }
      }, { b: '' })).toBe(true);
    });

    test('compares fields against an array of values', () => {
      expect(fn({
        path: 'a',
        validate: {
          required: {
            field: 'b',
            operator: '===',
            values: ['foo', 'bar']
          }
        }
      }, { b: 'foo' })).toBe(true);
    });

    test('compares complex-list field to root field', () => {
      expect(fn({
        path: 'a.0.b',
        validate: {
          required: {
            field: 'c',
            operator: 'empty'
          }
        }
      }, { a: [{ b: 'hi' }], c: '' })).toBe(true);
    });

    test('compares complex-list field to field in same list item', () => {
      expect(fn({
        path: 'a.0.b',
        validate: {
          required: {
            field: 'c',
            operator: 'empty'
          }
        }
      }, { a: [{ b: 'hi', c: '' }] })).toBe(true);
    });

    test(
      'compares complex-list field to field in same list item BEFORE checking root field',
      () => {
        expect(fn({
          path: 'a.0.b',
          validate: {
            required: {
              field: 'c',
              operator: '===',
              value: 'one'
            }
          }
        }, { a: [{ b: 'hi', c: 'one' }], c: 'two' })).toBe(true);
      }
    );

    test(
      'compares nested complex-list field to field in same list item BEFORE checking higher-level list',
      () => {
        expect(fn({
          path: 'a.0.b.0.c',
          validate: {
            required: {
              field: 'd',
              operator: '===',
              value: 'one'
            }
          }
        }, { a: [{ b: [{ c: 'hi', d: 'one' }], d: 'two' }] })).toBe(true);
      }
    );
  });

  describe('isValid', () => {
    const fn = lib.isValid;

    test('returns true if no validation rules', () => {
      expect(fn({ schema: { _has: 'text' } })).toBe(true);
    });

    test('returns true if non-empty and required', () => {
      expect(fn({ validate: { required: true }, value: 'hi' })).toBe(true);
    });

    test('returns false if empty and required', () => {
      expect(fn({ validate: { required: true }, value: '' })).toBe(false);
    });

    test('returns true if non-empty and conditionally-required', () => {
      expect(fn({ path: 'b', validate: { required: { field: 'a', operator: 'empty' } }, value: 'hi' }, { a: '' })).toBe(true);
    });

    test('returns false if empty and conditionally-required', () => {
      expect(fn({ path: 'b', validate: { required: { field: 'a', operator: 'empty' } }, value: '' }, { a: '' })).toBe(false);
    });

    test('returns true if pattern matches', () => {
      expect(fn({ validate: { pattern: '^a' }, value: 'abc' })).toBe(true);
    });

    test('returns true if pattern does not match', () => {
      expect(fn({ validate: { pattern: '^a' }, value: 'bcd' })).toBe(false);
    });

    test('returns true if string length >= min', () => {
      expect(fn({ validate: { min: 2 }, value: 'hi' })).toBe(true);
    });

    test('returns false if string length !>= min', () => {
      expect(fn({ validate: { min: 2 }, value: 'a' })).toBe(false);
    });

    test('returns true if array length >= min', () => {
      expect(fn({ validate: { min: 1 }, value: ['a'] })).toBe(true);
    });

    test('returns false if array length !>= min', () => {
      expect(fn({ validate: { min: 2 }, value: ['a'] })).toBe(false);
    });

    test('returns true if number value >= min', () => {
      expect(fn({ validate: { min: 5 }, value: 5 })).toBe(true);
    });

    test('returns false if number value !>= min', () => {
      expect(fn({ validate: { min: 5 }, value: 4 })).toBe(false);
    });

    test('returns true if string length <= max', () => {
      expect(fn({ validate: { max: 2 }, value: 'hi' })).toBe(true);
    });

    test('returns false if string length !<= max', () => {
      expect(fn({ validate: { max: 2 }, value: 'abc' })).toBe(false);
    });

    test('returns true if array length <= max', () => {
      expect(fn({ validate: { max: 1 }, value: ['a'] })).toBe(true);
    });

    test('returns false if array length !<= max', () => {
      expect(fn({ validate: { max: '1' }, value: ['a', 'b'] })).toBe(false);
    });

    test('returns true if number value <= max', () => {
      expect(fn({ validate: { max: 5 }, value: 5 })).toBe(true);
    });

    test('returns false if number value !<= max', () => {
      expect(fn({ validate: { max: 5 }, value: 6 })).toBe(false);
    });

    test('validates required directly', () => {
      expect(fn({ validate: { required: true }, value: 'hi' }, { a: 'hi' }, 'required')).toBe(true);
    });

    test('validates conditional-required directly', () => {
      expect(fn({ path: 'b', validate: { required: { field: 'a', operator: 'empty' } }, value: 'hi' }, { a: '' }, 'conditional-required')).toBe(true);
    });

    test('validates pattern directly', () => {
      expect(fn({ validate: { pattern: '^a' }, value: 'abc' }, { a: 'abc' }, 'pattern')).toBe(true);
    });

    test('validates min directly', () => {
      expect(fn({ validate: { min: 5 }, value: 5 }, { a: 5 }, 'min')).toBe(true);
    });

    test('validates max directly', () => {
      expect(fn({ validate: { max: 5 }, value: 5 }, { a: 5 }, 'max')).toBe(true);
    });

    test('throws error if validating an unsupported type', () => {
      expect(() => fn({ validate: { cool: true } }, {}, 'cool')).toThrow(Error);
    });
  });

  // DEPRECATED - will be removed in kiln 6.x

  describe('getInput', () => {
    const fn = lib.getInput;

    test('returns null if no inputs', () => {
      expect(fn('foo', { _has: {} })).toBe(null);
    });

    test('returns null if input not found in root', () => {
      expect(fn('foo', { _has: 'text' })).toBe(null);
    });

    test('returns null if input not found in complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: 'text'
          }]
        }
      })).toBe(null);
    });

    test('returns null if input not found in nested complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: {
              input: 'complex-list',
              props: [{
                prop: 'someOtherProp',
                _has: 'text'
              }]
            }
          }]
        }
      })).toBe(null);
    });

    test('returns input config if input found in root', () => {
      expect(fn('foo', { _has: 'foo' })).toEqual({ input: 'foo' });
    });

    test('returns input config if input found in complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: 'foo'
          }]
        }
      })).toEqual({ input: 'foo', _path: 'someProp' });
    });

    test('returns input config if input found in nested complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: {
              input: 'complex-list',
              props: [{
                prop: 'someOtherProp',
                _has: 'foo'
              }]
            }
          }]
        }
      })).toEqual({ input: 'foo', _path: 'someProp.someOtherProp' });
    });
  });

  describe('hasInput', () => {
    const fn = lib.hasInput;

    test('returns false if no inputs', () => {
      expect(fn('foo', { _has: {} })).toBe(false);
    });

    test('returns false if input not found in root', () => {
      expect(fn('foo', { _has: 'text' })).toBe(false);
    });

    test('returns false if input not found in complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: 'text'
          }]
        }
      })).toBe(false);
    });

    test('returns false if input not found in nested complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: {
              input: 'complex-list',
              props: [{
                prop: 'someOtherProp',
                _has: 'text'
              }]
            }
          }]
        }
      })).toBe(false);
    });

    test('returns true if input found in root', () => {
      expect(fn('foo', { _has: 'foo' })).toBe(true);
    });

    test('returns true if input found in complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: 'foo'
          }]
        }
      })).toBe(true);
    });

    test('returns true if input found in nested complex list', () => {
      expect(fn('foo', {
        _has: {
          input: 'complex-list',
          props: [{
            prop: 'someProp',
            _has: {
              input: 'complex-list',
              props: [{
                prop: 'someOtherProp',
                _has: 'foo'
              }]
            }
          }]
        }
      })).toBe(true);
    });
  });

  describe('getListProps', () => {
    const fn = lib.getListProps;

    test('returns null if no complex-list', () => {
      expect(fn({})).toBe(null);
    });
  });
});
