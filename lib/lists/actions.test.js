import * as lib from './actions';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';
import * as amphoraAPI from '../core-data/amphora-api';

describe('list actions', () => {
  describe('getList', () => {
    const fn = lib.getList,
      prefix = 'domain.com',
      listName = 'listName',
      error = new Error('error'),
      pendingPayload = { listName },
      successPayload = { listName, listItems: ['item1', 'item2'] },
      errorPayload = { listName, error };

    let sandbox;

    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(amphoraAPI, 'getList');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('can pend, then succeed', () => {
      const store = {
        commit: sinon.spy(),
        state: {
          site: {
            prefix
          }
        }
      };

      amphoraAPI.getList.returns(Promise.resolve(successPayload.listItems));
      return fn(store, listName)
        .then(() => {
          const commits = store.commit.getCalls();

          expect(amphoraAPI.getList).to.have.been.calledWith(prefix, listName);
          expect(commits[0].args).to.eql([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1].args).to.eql([LIST_LOAD_SUCCESS, successPayload]);
        });
    });

    it('can pend, then fail', () => {
      const store = {
        commit: sinon.spy(),
        state: {
          site: {
            prefix
          }
        }
      };

      amphoraAPI.getList.returns(Promise.reject(errorPayload));
      return fn(store, listName)
        .then(() => {
          const commits = store.commit.getCalls();

          expect(amphoraAPI.getList).to.have.been.calledWith(prefix, listName);
          expect(commits[0].args).to.deep.eql([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1].args[0]).to.deep.eql(LIST_LOAD_FAIL);
        });
    });
  });
});
