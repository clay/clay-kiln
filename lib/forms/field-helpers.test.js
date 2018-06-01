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
});
