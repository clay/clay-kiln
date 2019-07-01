import lib from './mutations';
import { UPDATE_LAYOUT_STATE } from './mutationTypes';

describe('layout state mutations', () => {
  test(
    `sets layout state for ${UPDATE_LAYOUT_STATE}`,
    () => expect(lib[UPDATE_LAYOUT_STATE]({ layout: {} }, { a: 'b' })).toEqual({ layout: { state: { a: 'b' } } })
  );
});
