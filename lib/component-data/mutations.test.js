import lib from './mutations';
import {
  UPDATE_COMPONENT, REVERT_COMPONENT, ADD_SCHEMA, RENDER_COMPONENT, REMOVE_COMPONENT, ADD_DEFAULT_DATA, OPEN_ADD_COMPONENT, CLOSE_ADD_COMPONENT
} from './mutationTypes';

const uri = 'domain.com/_components/a/instances/b',
  data = {
    foo: 'bar'
  },
  oldData = {
    foo: 'baz'
  };

describe('component data mutations', () => {
  test('updates component', () => {
    expect(lib[UPDATE_COMPONENT]({}, { uri, data })).toEqual({ components: { [uri]: data } });
  });

  test('reverts component', () => {
    expect(lib[REVERT_COMPONENT]({ components: { [uri]: data } }, { uri, oldData })).toEqual({ components: { [uri]: oldData } });
  });

  test('adds schema', () => {
    expect(lib[ADD_SCHEMA]({}, { name: 'foo', data })).toEqual({ schemas: { foo: { ...data, schemaName: 'foo' } } });
  });

  test('passes through on component render', () => {
    expect(lib[RENDER_COMPONENT]({ a: 'b' })).toEqual({ a: 'b' });
  });

  test('sets component to null on removal', () => {
    expect(lib[REMOVE_COMPONENT]({ components: { [uri]: data } }, { uri })).toEqual({ components: { [uri]: {} } });
  });

  test('adds default data', () => {
    expect(lib[ADD_DEFAULT_DATA]({}, { name: 'foo', data })).toEqual({ componentDefaults: { foo: data } });
  });

  test('opens the add component modal', () => {
    expect(lib[OPEN_ADD_COMPONENT]({}, { currentURI: 'foo' })).toEqual({ ui: { currentAddComponentModal: { currentURI: 'foo' } } });
  });

  test('closes the add component modal', () => {
    expect(lib[CLOSE_ADD_COMPONENT]({ ui: { currentAddComponentModal: { a: 'b' } } })).toEqual({ ui: { currentAddComponentModal: null } });
  });
});
