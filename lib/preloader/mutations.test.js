import lib from './mutations';
import { PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS, PRELOAD_SITE } from './mutationTypes';

define('preloader mutations', () => {
  it(`sets loading for ${PRELOAD_PENDING}`, () => {
    expect(lib[PRELOAD_PENDING]({})).to.eql({ isLoading: true });
  });

  it(`sets data and not loading for ${PRELOAD_SUCCESS}`, () => {
    expect(lib[PRELOAD_SUCCESS]({}, { a: true })).to.eql({ a: true, isLoading: false });
  });

  it(`sets not loading for ${LOADING_SUCCESS}`, () => {
    expect(lib[LOADING_SUCCESS]({})).to.eql({ isLoading: false });
  });

  it(`sets site data for ${PRELOAD_SITE}`, () => {
    expect(lib[PRELOAD_SITE]({}, { prefix: 'foo' })).to.eql({ site: { prefix: 'foo' }});
  });
});
