import lib from './mutations';
import { UPDATE_HASH, CLEAR_HASH } from './mutationTypes';

describe('deep-linking mutations', () => {
  test(
    `sets url for ${UPDATE_HASH}`,
    () => expect(lib[UPDATE_HASH]({}, { a: 'b' })).toEqual({ url: { a: 'b' } })
  );
  test(
    `clears url for ${CLEAR_HASH}`,
    () => expect(lib[CLEAR_HASH]({ url: { a: 'b' } })).toEqual({ url: null })
  );
});
