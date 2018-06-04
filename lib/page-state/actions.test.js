import { updateHistoryWithEditAction } from './actions';

describe('updating page history with edit event', () => {
  let currentUser = { username: 'a@b'};

  test('will create a history array if one does not exist', () => {
    let state = {};

    state.history = updateHistoryWithEditAction(state, currentUser);
    expect(Array.isArray(state.history)).toBe(true);
  });

  test(
    'will add a new edit event if the latest event is not an edit event',
    () => {
      let state = { history: [{action: 'create'}]};

      state.history = updateHistoryWithEditAction(state, currentUser);
      expect(state.history[state.history.length - 1].action).toBe('edit');
    }
  );

  test(
    'will add the user to the latest event if that event is an edit event',
    () => {
      let state = { history: [{action: 'edit', users: [{username: 'c@d'}]}]};

      state.history = updateHistoryWithEditAction(state, currentUser);
      expect(state.history[state.history.length - 1].users).toEqual([{username: 'c@d'}, {username: 'a@b'}]);
    }
  );

  test(
    'will move the user to be the latest the user is already included',
    () => {
      let state = { history: [{action: 'edit', users: [{username: 'a@b' }, {username: 'c@d'}]}]};

      state.history = updateHistoryWithEditAction(state, currentUser);
      expect(state.history[state.history.length - 1].users).toEqual([{username: 'c@d'}, {username: 'a@b'}]);
    }
  );
});
