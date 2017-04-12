import actions from './actions';
import {
  LIST_LOAD_PENDING,
  LIST_LOAD_SUCCESS,
  LIST_LOAD_FAIL
} from './mutationTypes';

describe('list actions', () => {

  describe('getList', () => {

    const prefix = 'prefix',
      listName = 'listName',
      pendingPayload = {listName},
      successPayload = {listName, listItems: ['item1', 'item2']};

    it('can pend, then succeed', () => {
      const store = {
          commit: sinon.spy()
        },
        getListFromAmphora = sinon.spy(() => Promise.resolve(successPayload.listItems));

      return actions.getList(store, {prefix, listName}, getListFromAmphora)
        .then(() => {
          expect(getListFromAmphora).to.have.been.calledWith(prefix, listName);
          const commits = store.commit.getCalls();

          expect(commits[0].args).to.deep.eql([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1].args).to.deep.eql([LIST_LOAD_SUCCESS, successPayload]);
        });
    });

    it('can pend, then fail', () => {
      const store = {
          commit: sinon.spy()
        },
        error = new Error('error'),
        pendingPayload = {listName},
        errorPayload = {listName, error},
        getListFromAmphora = sinon.spy(() => Promise.reject(errorPayload));

      return actions.getList(store, {prefix, listName}, getListFromAmphora)
        .then(() => {
          const commits = store.commit.getCalls();
          
          expect(commits[0].args).to.deep.eql([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1].args[0]).to.deep.eql(LIST_LOAD_FAIL);
        });
    });

  });
});
