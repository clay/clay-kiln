import lib from './mutations';
import { OPEN_FORM, CLOSE_FORM } from './mutationTypes';

const uri = 'foo',
  path = 'bar',
  data = { bar: 1 };

define('form mutations', () => {
  it(`sets current form for ${OPEN_FORM}`, () => {
    expect(lib[OPEN_FORM]({}, uri, path, data)).to.eql({ ui: { currentForm: { uri, path, data } } });
  });

  it(`sets current form for ${CLOSE_FORM}`, () => {
    expect(lib[CLOSE_FORM]({ ui: { currentForm: { uri, path, data } }})).to.eql({ ui: { currentForm: null } });
  });
});
