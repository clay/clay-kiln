import lib from './mutations';
import { UPDATE_HASH, CLEAR_HASH } from './mutationTypes';

define('deep-linking mutations', () => {
  it(`sets url for ${UPDATE_HASH}`, () => expect(lib[UPDATE_HASH]({}, { a: 'b' })).to.eql({ url: { a: 'b' }}));
  it(`clears url for ${CLEAR_HASH}`, () => expect(lib[CLEAR_HASH]({ url: { a: 'b' }})).to.eql({ url: null}));
});
