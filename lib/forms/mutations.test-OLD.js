import expect from 'expect';
import lib from './mutations';
import { OPEN_FORM, CLOSE_FORM, UPDATE_FORMDATA } from './mutationTypes';

const uri = 'foo',
  path = 'bar',
  inline = true,
  fields = { bar: 1 },
  schema = { bar: { _has: 'text' }},
  initialOffset = 0,
  appendText = null,
  pos = null;

define('form mutations', () => {
  test(`sets current form for ${OPEN_FORM}`, () => {
    expect(lib[OPEN_FORM]({}, { uri, path, inline, fields, schema, initialOffset, appendText, pos })).to.eql({ ui: { currentForm: { uri, path, inline, fields, schema, initialOffset, appendText, pos } } });
  });

  test(`sets current form for ${CLOSE_FORM}`, () => {
    expect(lib[CLOSE_FORM]({ ui: { currentForm: { uri, path, fields, schema } }})).to.eql({ ui: { currentForm: null } });
  });

  test('updates form data', () => {
    expect(lib[UPDATE_FORMDATA]({ ui: { currentForm: { fields: {} }}}, { path: 'foo', data: 'sup' })).to.eql({ ui: { currentForm: { fields: { foo: 'sup' }}}});
  });

  test('updates form data with deep path', () => {
    expect(lib[UPDATE_FORMDATA]({ ui: { currentForm: { fields: { foo: [{ bar: 'hi' }] } }}}, { path: 'foo.0.bar', data: 'sup' })).to.eql({ ui: { currentForm: { fields: { foo: [{ bar: 'sup' }] }}}});
  });
});
