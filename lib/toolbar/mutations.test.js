import lib from './mutations';
import { FINISH_PROGRESS, OPEN_MODAL, CLOSE_MODAL } from './mutationTypes';

describe('toolbar mutations', () => {
  test(`finishes progress for ${FINISH_PROGRESS}`, () => {
    expect(lib[FINISH_PROGRESS]({})).toEqual({ ui: { currentProgress: 0 } });
  });

  test('opens modals', () => {
    expect(lib[OPEN_MODAL]({}, { title: 'Hi', type: 'foo' })).toEqual({ ui: { currentModal: { title: 'Hi', type: 'foo' } } });
  });

  test('closes modals', () => {
    expect(lib[CLOSE_MODAL]({ ui: { currentModal: { title: 'Hi', type: 'foo' } } })).toEqual({ ui: { currentModal: null } });
  });
});
