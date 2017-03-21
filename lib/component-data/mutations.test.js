import lib from './mutations';
import { UPDATE_COMPONENT, REVERT_COMPONENT, ADD_SCHEMA, RENDER_COMPONENT, REMOVE_COMPONENT, ADD_DEFAULT_DATA } from './mutationTypes';

const uri = 'domain.com/components/a/instances/b',
  data = {
    foo: 'bar'
  },
  oldData = {
    foo: 'baz'
  };

define('component data mutations', () => {
  it('updates component', () => {
    expect(lib[UPDATE_COMPONENT]({}, { uri, data })).to.eql({ components: { [uri]: data } });
  });

  it('reverts component', () => {
    expect(lib[REVERT_COMPONENT]({ components: { [uri]: data } }, { uri, oldData })).to.eql({ components: { [uri]: oldData }});
  });

  it('adds schema', () => {
    expect(lib[ADD_SCHEMA]({}, { name: 'foo', data })).to.eql({ schemas: { foo: data }});
  });

  it('passes through on component render', () => {
    expect(lib[RENDER_COMPONENT]({ a: 'b' })).to.eql({ a: 'b' });
  });

  it('sets component to null on removal', () => {
    expect(lib[REMOVE_COMPONENT]({ components: { [uri]: data } }, { uri })).to.eql({ components: { [uri]: null }});
  });

  it('adds default data', () => {
    expect(lib[ADD_DEFAULT_DATA]({}, { name: 'foo', data })).to.eql({ componentDefaults: { foo: data }});
  });
});
