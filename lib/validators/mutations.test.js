import { UPDATE_VALIDATION } from './mutationTypes';
import lib from './mutations';

describe('validator mutations', () => {
  it(`sets validation for ${UPDATE_VALIDATION}`, () => {
    expect(lib[UPDATE_VALIDATION]({}, { errors: [], warnings: [] })).to.eql({ validation: { errors: [], warnings: [] } });
  });
});
