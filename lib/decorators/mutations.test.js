import lib from './mutations';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';

define('preloader mutations', () => {
  const uri = 'foo',
    parentField = { path: 'bar' },
    parentURI = 'baz';

  it(`sets current selection for ${SELECT}`, () => {
    expect(lib[SELECT]({}, { uri, parentField, parentURI })).to.eql({ ui: { currentSelection: { uri, parentField, parentURI } } });
  });

  it(`sets current selection for ${UN_SELECT}`, () => {
    expect(lib[UN_SELECT]({ ui: { currentSelection: { uri, parentField, parentURI } }})).to.eql({ ui: { currentSelection: null } });
  });

  it(`sets current focus for ${FOCUS}`, () => {
    const focus = { uri: 'foo', path: 'bar' };

    expect(lib[FOCUS]({}, focus)).to.eql({ ui: { currentFocus: focus }});
  });

  it(`sets current focus for ${UN_FOCUS}`, () => {
    const focus = { uri: 'foo', path: 'bar' };

    expect(lib[UN_FOCUS]({ ui: { currentFocus: focus }})).to.eql({ ui: { currentFocus: null }});
  });
});
