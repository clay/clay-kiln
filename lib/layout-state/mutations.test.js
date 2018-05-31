import lib from './mutations';
import { UPDATE_LAYOUT_STATE } from './mutationTypes';

define('layout state mutations', () => {
  it(`sets layout state for ${UPDATE_LAYOUT_STATE}`, () => expect(lib[UPDATE_LAYOUT_STATE]({ layout: {}}, { a: 'b' })).to.eql({ layout: { a: 'b' }}));
});
