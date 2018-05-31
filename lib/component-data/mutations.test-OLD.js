import expect from 'expect';
import lib from './mutations';
import { UPDATE_COMPONENT, REVERT_COMPONENT, ADD_SCHEMA, RENDER_COMPONENT, REMOVE_COMPONENT, ADD_DEFAULT_DATA, OPEN_ADD_COMPONENT, CLOSE_ADD_COMPONENT } from './mutationTypes';

const uri = 'domain.com/_components/a/instances/b',
  data = {
    foo: 'bar'
  },
  oldData = {
    foo: 'baz'
  };

define('component data mutations', () => {
  test('updates component', () => {
    expect(lib[UPDATE_COMPONENT]({}, { uri, data })).to.eql({ components: { [uri]: data } });
  });

  test('reverts component', () => {
    expect(lib[REVERT_COMPONENT]({ components: { [uri]: data } }, { uri, oldData })).to.eql({ components: { [uri]: oldData }});
  });

  test('adds schema', () => {
    expect(lib[ADD_SCHEMA]({}, { name: 'foo', data })).to.eql({ schemas: { foo: data }});
  });

  test('passes through on component render', () => {
    expect(lib[RENDER_COMPONENT]({ a: 'b' })).to.eql({ a: 'b' });
  });

  test('sets component to null on removal', () => {
    expect(lib[REMOVE_COMPONENT]({ components: { [uri]: data } }, { uri })).to.eql({ components: { [uri]: {} }});
  });

  test('adds default data', () => {
    expect(lib[ADD_DEFAULT_DATA]({}, { name: 'foo', data })).to.eql({ componentDefaults: { foo: data }});
  });

  test('opens the add component modal', () => {
    expect(lib[OPEN_ADD_COMPONENT]({}, { currentURI: 'foo' })).to.eql({ ui: { currentAddComponentModal: { currentURI: 'foo' }}});
  });

  test('closes the add component modal', () => {
    expect(lib[CLOSE_ADD_COMPONENT]({ ui: { currentAddComponentModal: { a: 'b' }}})).to.eql({ ui: { currentAddComponentModal: null }});
  });
});
