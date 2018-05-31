import expect from 'expect';
import * as lib from './components';

const uri = '/_components/foo',
  ok = { bar: 'baz' },
  testStore = {
    state: {
      components: { [uri]: ok },
      componentDefaults: { foo: ok },
      schemas: { foo: ok },
      templates: { foo: ok },
      models: { foo: ok, fooBar: ok },
      locals: ok
    }
  };

describe('components helper functions', () => {
  test('gets data', () => expect(lib.getData(uri, null, testStore)).to.eql(ok));
  test(
    'gets subset of data with path',
    () => expect(lib.getData(uri, 'bar', testStore)).to.eql('baz')
  );
  test(
    'gets default data from uri',
    () => expect(lib.getDefaultData(uri, testStore)).to.eql(ok)
  );
  test(
    'gets default data from name',
    () => expect(lib.getDefaultData('foo', testStore)).to.eql(ok)
  );
  test(
    'gets schema from uri',
    () => expect(lib.getSchema(uri, null, testStore)).to.eql(ok)
  );
  test(
    'gets schema from name',
    () => expect(lib.getSchema('foo', null, testStore)).to.eql(ok)
  );
  test(
    'gets subset of schema with path',
    () => expect(lib.getSchema(uri, 'bar', testStore)).to.eql('baz')
  );
  test('gets template', () => expect(lib.getTemplate(uri, testStore)).to.eql(ok));
  test('gets model', () => expect(lib.getModel(uri, testStore)).to.eql(ok));
  test(
    'uses camelCase for models',
    () => expect(lib.getModel('/_components/foo', testStore)).to.eql(ok)
  );
  test('gets locals', () => expect(lib.getLocals(testStore)).to.eql(ok));
});
