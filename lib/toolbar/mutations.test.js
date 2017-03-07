import lib from './mutations';
import { SHOW_STATUS, HIDE_STATUS, START_PROGRESS, FINISH_PROGRESS } from './mutationTypes';

define('toolbar mutations', () => {
  it(`shows status for ${SHOW_STATUS}`, () => {
    expect(lib[SHOW_STATUS]({}, 'foo')).to.eql({ ui: { currentStatus: 'foo', }});
  });

  it(`hides status for ${HIDE_STATUS}`, () => {
    expect(lib[HIDE_STATUS]({})).to.eql({ ui: { currentStatus: null, }});
  });

  it(`starts progress for ${START_PROGRESS}`, () => {
    const state = lib[START_PROGRESS]({});

    expect(state.ui.progressColor).to.eql('save');
  });

  it('starts progress with custom color', () => {
    const state = lib[START_PROGRESS]({}, 'publish');

    expect(state.ui.progressColor).to.eql('publish');
  });

  it(`finishes progress for ${FINISH_PROGRESS}`, () => {
    expect(lib[FINISH_PROGRESS]({})).to.eql({ ui: { progressColor: 'save', currentProgress: 0 }});
  });

  it('finishes progress with custom color', () => {
    expect(lib[FINISH_PROGRESS]({}, 'published')).to.eql({ ui: { progressColor: 'published', currentProgress: 0 }});
  });

  // it(`sets loading for ${PRELOAD_PENDING}`, () => {
  //   expect(lib[PRELOAD_PENDING]({})).to.eql({ isLoading: true });
  // });
  //
  // it(`sets data and not loading for ${PRELOAD_SUCCESS}`, () => {
  //   expect(lib[PRELOAD_SUCCESS]({}, { a: true })).to.eql({ a: true, isLoading: false });
  // });
  //
  // it(`sets not loading for ${LOADING_SUCCESS}`, () => {
  //   expect(lib[LOADING_SUCCESS]({})).to.eql({ isLoading: false });
  // });
});
