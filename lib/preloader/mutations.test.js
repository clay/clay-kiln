import expect from 'expect';
import lib from './mutations';
import { PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS, PRELOAD_SITE, PRELOAD_ALL_SITES } from './mutationTypes';

define('preloader mutations', () => {
  test(`sets loading for ${PRELOAD_PENDING}`, () => {
    expect(lib[PRELOAD_PENDING]({})).to.eql({});
  });

  test(`sets data and not loading for ${PRELOAD_SUCCESS}`, () => {
    expect(lib[PRELOAD_SUCCESS]({}, { a: true })).to.eql({ a: true });
  });

  test(`sets not loading for ${LOADING_SUCCESS}`, () => {
    expect(lib[LOADING_SUCCESS]({})).to.eql({ isLoading: false });
  });

  test(`sets site data for ${PRELOAD_SITE}`, () => {
    expect(lib[PRELOAD_SITE]({}, { prefix: 'foo' })).to.eql({ site: { prefix: 'foo' }});
  });

  test(`sets allSites data for ${PRELOAD_ALL_SITES}`, () => {
    expect(lib[PRELOAD_ALL_SITES]({}, { a: {prefix: 'foo'} })).to.eql({ allSites: { a: { prefix: 'foo' }}});
  });
});
