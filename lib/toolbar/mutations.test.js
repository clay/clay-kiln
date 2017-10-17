import lib from './mutations';
import { SHOW_STATUS, HIDE_STATUS, FINISH_PROGRESS, OPEN_MODAL, CLOSE_MODAL } from './mutationTypes';

define('toolbar mutations', () => {
  it(`shows status for ${SHOW_STATUS}`, () => {
    expect(lib[SHOW_STATUS]({}, 'foo')).to.eql({ ui: { currentStatus: 'foo', }});
  });

  it(`hides status for ${HIDE_STATUS}`, () => {
    expect(lib[HIDE_STATUS]({})).to.eql({ ui: { currentStatus: null, }});
  });

  it(`finishes progress for ${FINISH_PROGRESS}`, () => {
    expect(lib[FINISH_PROGRESS]({})).to.eql({ ui: { currentProgress: 0 }});
  });

  it('opens modals', () => {
    expect(lib[OPEN_MODAL]({}, { title: 'Hi', type: 'foo' })).to.eql({ ui: { currentModal: { title: 'Hi', type: 'foo' }}});
  });

  it('closes modals', () => {
    expect(lib[CLOSE_MODAL]({ ui: { currentModal: { title: 'Hi', type: 'foo' }}})).to.eql({ ui: { currentModal: null }});
  });
});
