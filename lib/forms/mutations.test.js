import lib from './mutations';
import { OPEN_FORM, CLOSE_FORM } from './mutationTypes';

const uri = 'foo',
  path = 'bar',
  fields = { bar: 1 },
  schema = { bar: { _has: 'text' }},
  el = document.createElement('span'),
  initialOffset = 0,
  appendText = null;

define('form mutations', () => {
  it(`sets current form for ${OPEN_FORM}`, () => {
    expect(lib[OPEN_FORM]({}, { uri, path, fields, schema, el, initialOffset, appendText })).to.eql({ ui: { currentForm: { uri, path, fields, schema, el, initialOffset, appendText } } });
  });

  it(`sets current form for ${CLOSE_FORM}`, () => {
    expect(lib[CLOSE_FORM]({ ui: { currentForm: { uri, path, fields, schema, el } }})).to.eql({ ui: { currentForm: null } });
  });
});
