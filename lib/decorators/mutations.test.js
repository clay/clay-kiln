import lib from './mutations';
import {
  SELECT, UN_SELECT, FOCUS, UN_FOCUS
} from './mutationTypes';

describe('preloader mutations', () => {
  const uri = 'foo',
    parentField = { path: 'bar' },
    parentURI = 'baz';

  test(`sets current selection for ${SELECT}`, () => {
    expect(lib[SELECT]({}, { uri, parentField, parentURI })).toEqual({ ui: { currentSelection: { uri, parentField, parentURI } } });
  });

  test(`sets current selection for ${UN_SELECT}`, () => {
    expect(lib[UN_SELECT]({ ui: { currentSelection: { uri, parentField, parentURI } } })).toEqual({ ui: { currentSelection: null } });
  });

  test(`sets current focus for ${FOCUS}`, () => {
    const focus = { uri: 'foo', path: 'bar' };

    expect(lib[FOCUS]({}, focus)).toEqual({ ui: { currentFocus: focus } });
  });

  test(`sets current focus for ${UN_FOCUS}`, () => {
    const focus = { uri: 'foo', path: 'bar' };

    expect(lib[UN_FOCUS]({ ui: { currentFocus: focus } })).toEqual({ ui: { currentFocus: null } });
  });
});
