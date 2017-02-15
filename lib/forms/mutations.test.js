import lib from './mutations';
import { OPEN_FORM, CLOSE_FORM } from './mutationTypes';

const uri = 'foo',
  path = 'bar',
  fields = { bar: 1 },
  schema = { bar: { _has: 'text' }};

define('form mutations', () => {
  it(`sets current form for ${OPEN_FORM}`, () => {
    expect(lib[OPEN_FORM]({}, { uri, path, fields, schema })).to.eql({ ui: { currentForm: { uri, path, fields, schema } } });
  });

  it(`sets current form for ${CLOSE_FORM}`, () => {
    expect(lib[CLOSE_FORM]({ ui: { currentForm: { uri, path, fields, schema } }})).to.eql({ ui: { currentForm: null } });
  });
});
