import lib from './mutations';
import { UPDATE_PAGE_STATE, UPDATE_PAGEURI } from './mutationTypes';

describe('page state mutations', () => {
  test(
    `sets page state for ${UPDATE_PAGE_STATE}`,
    () => expect(lib[UPDATE_PAGE_STATE]({ page: { state: {} } }, { a: 'b' })).toEqual({ page: { state: { a: 'b' } } })
  );
  test(
    `sets page uri for ${UPDATE_PAGEURI}`,
    () => expect(lib[UPDATE_PAGEURI]({ page: {} }, 'foo')).toEqual({ page: { uri: 'foo' } })
  );
});
