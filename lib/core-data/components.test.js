import * as lib from './components';

const uri = '/components/foo',
  ok = { bar: 'baz' },
  testStore = {
    state: {
      components: { [uri]: ok },
      schemas: { foo: ok },
      templates: { foo: ok },
      models: { foo: ok }
    }
  };

describe('components helper functions', () => {
  it('gets data', () => expect(lib.getData(uri, testStore)).to.eql(ok));
  it('gets schema', () => expect(lib.getSchema(uri, testStore)).to.eql(ok));
  it('gets template', () => expect(lib.getTemplate(uri, testStore)).to.eql(ok));
  it('gets model', () => expect(lib.getModel(uri, testStore)).to.eql(ok));
});
