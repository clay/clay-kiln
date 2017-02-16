import * as lib from './components';

const uri = '/components/foo',
  ok = { bar: 'baz' },
  testStore = {
    state: {
      components: { [uri]: ok },
      schemas: { foo: ok },
      templates: { foo: ok },
      models: { foo: ok, fooBar: ok },
      locals: ok
    }
  };

describe('components helper functions', () => {
  it('gets data', () => expect(lib.getData(uri, null, testStore)).to.eql(ok));
  it('gets subset of data with path', () => expect(lib.getData(uri, 'bar', testStore)).to.eql('baz'));
  it('gets schema', () => expect(lib.getSchema(uri, null, testStore)).to.eql(ok));
  it('gets subset of schema with path', () => expect(lib.getSchema(uri, 'bar', testStore)).to.eql('baz'));
  it('gets template', () => expect(lib.getTemplate(uri, testStore)).to.eql(ok));
  it('gets model', () => expect(lib.getModel(uri, testStore)).to.eql(ok));
  it('uses camelCase for models', () => expect(lib.getModel('/components/foo', testStore))).to.eql(ok);
  it('gets locals', () => expect(lib.getLocals())).to.eql(ok);
});
