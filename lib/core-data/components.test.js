import * as lib from './components';

const uri = '/_components/foo',
  ok = { bar: 'baz' },
  testStore = {
    state: {
      components: { [uri]: ok },
      componentDefaults: { foo: ok },
      schemas: {
        foo: {
          bar: 'baz',
          baz: {
            _has: {
              input: 'complex-list',
              props: [{
                prop: 'qux',
                _has: 'text'
              }]
            }
          },
          __doubleUnderscoredProp: {
            _has: {
              help: 'Some sample help text'
            }
          }
        }
      },
      templates: { foo: ok },
      models: { foo: ok, fooBar: ok },
      locals: ok
    }
  };

describe('components helper functions', () => {
  test('gets data', () => expect(lib.getData(uri, null, testStore)).toEqual(ok));
  test(
    'gets subset of data with path',
    () => expect(lib.getData(uri, 'bar', testStore)).toEqual('baz')
  );
  test(
    'gets default data from uri',
    () => expect(lib.getDefaultData(uri, testStore)).toEqual(ok)
  );
  test(
    'gets default data from name',
    () => expect(lib.getDefaultData('foo', testStore)).toEqual(ok)
  );
  test(
    'gets schema from uri',
    () => expect(lib.getSchema(uri, null, testStore)).toEqual(testStore.state.schemas.foo)
  );
  test(
    'gets schema from name',
    () => expect(lib.getSchema('foo', null, testStore)).toEqual(testStore.state.schemas.foo)
  );
  test(
    'gets subset of schema with path',
    () => expect(lib.getSchema(uri, 'bar', testStore)).toEqual('baz')
  );
  test(
    'gets subset of schema with deep path',
    () => expect(lib.getSchema(uri, 'baz.0.qux', testStore)).toEqual({ prop: 'qux', _has: 'text' })
  );
  test('gets template', () => expect(lib.getTemplate(uri, testStore)).toEqual(ok));
  test('gets model', () => expect(lib.getModel(uri, testStore)).toEqual(ok));
  test(
    'uses camelCase for models',
    () => expect(lib.getModel('/_components/foo', testStore)).toEqual(ok)
  );
  test('gets locals', () => expect(lib.getLocals(testStore)).toEqual(ok));
});
