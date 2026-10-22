import lib from './mutations';
import {
  COLLAB_START, COLLAB_ACTIVITY, COLLAB_PENDING, COLLAB_PENDING_DONE, COLLAB_STALE
} from './mutationTypes';

const ada = { id: 'a', name: 'Ada' },
  grace = { id: 'g', name: 'Grace' };

function started() {
  return lib[COLLAB_START]({}, { session: 's1' });
}

describe('collab mutations', () => {
  test('start sets up empty collaboration state', () => {
    expect(started().collab).toEqual({
      session: 's1', connected: false, failures: 0, lastSync: null, others: [], activity: [], pending: {}, flashes: [], stale: false
    });
  });

  describe(COLLAB_ACTIVITY, () => {
    test('adds newest first', () => {
      let state = started();

      state = lib[COLLAB_ACTIVITY](state, {
        id: 1, user: ada, at: 1000, text: 'published the page'
      });
      state = lib[COLLAB_ACTIVITY](state, {
        id: 2, user: grace, at: 2000, labels: ['Paragraph']
      });

      expect(state.collab.activity.map(entry => entry.id)).toEqual([2, 1]);
    });

    test('collapses one person\'s burst of edits into one line', () => {
      let state = started();

      state = lib[COLLAB_ACTIVITY](state, {
        id: 1, user: ada, at: 1000, labels: ['Article']
      });
      state = lib[COLLAB_ACTIVITY](state, {
        id: 2, user: ada, at: 3000, labels: ['Paragraph']
      });
      state = lib[COLLAB_ACTIVITY](state, {
        id: 3, user: ada, at: 4000, labels: ['Article']
      });

      expect(state.collab.activity).toEqual([{
        id: 3, user: ada, at: 4000, labels: ['Article', 'Paragraph']
      }]);
    });

    test('keeps separate lines for different people, or edits far apart', () => {
      let state = started();

      state = lib[COLLAB_ACTIVITY](state, {
        id: 1, user: ada, at: 1000, labels: ['Article']
      });
      state = lib[COLLAB_ACTIVITY](state, {
        id: 2, user: grace, at: 2000, labels: ['Article']
      });
      state = lib[COLLAB_ACTIVITY](state, {
        id: 3, user: grace, at: 60000, labels: ['Paragraph']
      });

      expect(state.collab.activity.length).toBe(3);
    });
  });

  test('pending changes are added and cleared per uri', () => {
    let state = started();

    state = lib[COLLAB_PENDING](state, { uri: 'x', by: { user: ada }, rev: 3 });
    expect(state.collab.pending).toEqual({ x: { by: { user: ada }, rev: 3 } });
    state = lib[COLLAB_PENDING_DONE](state, 'x');
    expect(state.collab.pending).toEqual({});
  });

  test(`${COLLAB_STALE} turns the reload notice on and off`, () => {
    let state = started();

    state = lib[COLLAB_STALE](state, true);
    expect(state.collab.stale).toBe(true);
    state = lib[COLLAB_STALE](state, false);
    expect(state.collab.stale).toBe(false);
  });
});
