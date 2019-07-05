import lib from './mutations';
import {
  PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS, PRELOAD_SITE, PRELOAD_ALL_SITES
} from './mutationTypes';

describe('preloader mutations', () => {
  test(`sets loading for ${PRELOAD_PENDING}`, () => {
    expect(lib[PRELOAD_PENDING]({})).toEqual({});
  });

  test(`sets data and not loading for ${PRELOAD_SUCCESS}`, () => {
    expect(lib[PRELOAD_SUCCESS]({}, { a: true })).toEqual({ a: true });
  });

  test(`sets not loading for ${LOADING_SUCCESS}`, () => {
    expect(lib[LOADING_SUCCESS]({})).toEqual({ isLoading: false });
  });

  test(`sets site data for ${PRELOAD_SITE}`, () => {
    expect(lib[PRELOAD_SITE]({}, { prefix: 'foo' })).toEqual({ site: { prefix: 'foo' } });
  });

  test(`sets allSites data for ${PRELOAD_ALL_SITES}`, () => {
    expect(lib[PRELOAD_ALL_SITES]({}, { a: { prefix: 'foo' } })).toEqual({ allSites: { a: { prefix: 'foo' } } });
  });
});
