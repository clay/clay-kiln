import lib from './mutations';
import { UPDATE_PAGESTATE, UPDATE_PAGEURI, UPDATE_PAGE_LIST_DATA } from './mutationTypes';

define('page state mutations', () => {
  it(`sets page state for ${UPDATE_PAGESTATE}`, () => expect(lib[UPDATE_PAGESTATE]({ page: { state: {}}}, { a: 'b' })).to.eql({ page: {state: { a: 'b' }}}));
  it(`sets page uri for ${UPDATE_PAGEURI}`, () => expect(lib[UPDATE_PAGEURI]({ page: {}}, 'foo')).to.eql({ page: { uri: 'foo' }}));
  it(`sets page list data for ${UPDATE_PAGE_LIST_DATA}`, () => {
    expect(lib[UPDATE_PAGE_LIST_DATA]({ page: { listData: {}} }, { title: 'Foo' })).to.eql({ page: { listData: { title: 'Foo' }}});
  });
});
