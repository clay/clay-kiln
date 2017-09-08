import lib from './mutations';
import { OPEN_FORM, CLOSE_FORM, UPDATE_FORMDATA } from './mutationTypes';

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

  it('updates form data', () => {
    expect(lib[UPDATE_FORMDATA]({ ui: { currentForm: { fields: {} }}}, { path: 'foo', data: 'sup' })).to.eql({ ui: { currentForm: { fields: { foo: 'sup' }}}});
  });

  it('updates form data with deep path', () => {
    expect(lib[UPDATE_FORMDATA]({ ui: { currentForm: { fields: { foo: [{ bar: 'hi' }] } }}}, { path: 'foo.0.bar', data: 'sup' })).to.eql({ ui: { currentForm: { fields: { foo: [{ bar: 'sup' }] }}}});
  });
});
