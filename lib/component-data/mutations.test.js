import lib from './mutations';
import { UPDATE_COMPONENT, REVERT_COMPONENT, ADD_SCHEMA } from './mutationTypes';

const uri = 'domain.com/components/a/instances/b',
  data = {
    foo: 'bar'
  },
  oldData = {
    foo: 'baz'
  };

define('pane mutations', () => {
  it('opens pane', () => {
    expect(lib[UPDATE_COMPONENT]({}, { uri, data })).to.eql({ components: { [uri]: data } });
  });

  it('closes pane', () => {
    expect(lib[REVERT_COMPONENT]({ components: { [uri]: data } }, { uri, oldData })).to.eql({ components: { [uri]: oldData }});
  });

  it('changes pane', () => {
    expect(lib[ADD_SCHEMA]({}, { name: 'foo', data })).to.eql({ schemas: { foo: data }});
  });
});
