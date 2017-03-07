import { UPDATE_VALIDATION } from './mutationTypes';
import lib from './mutations';

describe('validator mutations', () => {
  describe(UPDATE_VALIDATION, () => {
    it('sets validation in state', () => {
      expect(lib[UPDATE_VALIDATION]({}, { errors: [], warnings: [] })).to.eql({ validation: { errors: [], warnings: [] } });
    });
  });
});
