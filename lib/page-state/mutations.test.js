import lib from './mutations';
import { UPDATE_PAGE_STATE, UPDATE_PAGEURI } from './mutationTypes';

define('page state mutations', () => {
  it(`sets page state for ${UPDATE_PAGE_STATE}`, () => expect(lib[UPDATE_PAGE_STATE]({ page: { state: {}}}, { a: 'b' })).to.eql({ page: {state: { a: 'b' }}}));
  it(`sets page uri for ${UPDATE_PAGEURI}`, () => expect(lib[UPDATE_PAGEURI]({ page: {}}, 'foo')).to.eql({ page: { uri: 'foo' }}));
});
