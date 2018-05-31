import expect from 'expect';
import { UPDATE_VALIDATION } from './mutationTypes';
import lib from './mutations';

describe('validator mutations', () => {
  test(`sets validation for ${UPDATE_VALIDATION}`, () => {
    expect(lib[UPDATE_VALIDATION]({}, { errors: [], warnings: [] })).to.eql({ validation: { errors: [], warnings: [] } });
  });
});
