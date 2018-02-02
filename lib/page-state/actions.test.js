import {updateHistoryWithEditAction} from './actions';

define('updating page history with edit event', () => {
  let currentUser = { username: 'a@b'};

  it('will create a history array if one does not exist', () => {
    let state = {};

    state.history = updateHistoryWithEditAction(state, currentUser);
    expect(Array.isArray(state.history)).to.equal(true);
  });

  it('will add a new edit event if the latest event is not an edit event', () => {
    let state = { history: [{action: 'create'}]};

    state.history = updateHistoryWithEditAction(state, currentUser);
    expect(state.history[state.history.length - 1].action).to.equal('edit');
  });

  it('will add the user to the latest event if that event is an edit event', () => {
    let state = { history: [{action: 'edit', users: [{username: 'c@d'}]}]};

    state.history = updateHistoryWithEditAction(state, currentUser);
    expect(state.history[state.history.length - 1].users).to.deep.equal([{username: 'c@d'}, {username: 'a@b'}]);
  });

  it('will do nothing if the latest event is an edit event and the user is already included', () => {
    let state = { history: [{action: 'edit', users: [{username: 'a@b' }, {username: 'c@d'}]}]};

    state.history = updateHistoryWithEditAction(state, currentUser);
    expect(state.history[state.history.length - 1].users).to.deep.equal([{username: 'a@b'}, {username: 'c@d'}]);
  });
});
