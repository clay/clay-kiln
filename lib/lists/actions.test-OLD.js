import expect from 'expect';
import * as lib from './actions';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';
import * as api from '../core-data/api';

describe('list actions', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(api, 'getList');
    sandbox.stub(api, 'saveList');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getList', () => {
    const fn = lib.getList,
      prefix = 'domain.com',
      listName = 'listName',
      error = new Error('error'),
      pendingPayload = { listName },
      successPayload = { listName, listItems: ['item1', 'item2'] },
      errorPayload = { listName, error };

    test('can pend, then succeed', () => {
      const store = {
        commit: sinon.spy(),
        state: {
          site: {
            prefix
          }
        }
      };

      api.getList.returns(Promise.resolve(successPayload.listItems));
      return fn(store, listName)
        .then(() => {
          const commits = store.commit.getCalls();

          expect(api.getList).to.have.been.calledWith(prefix, listName);
          expect(commits[0].args).to.eql([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1].args).to.eql([LIST_LOAD_SUCCESS, successPayload]);
        });
    });

    test('can pend, then fail', () => {
      const store = {
        commit: sinon.spy(),
        state: {
          site: {
            prefix
          }
        }
      };

      api.getList.returns(Promise.reject(errorPayload));
      return fn(store, listName)
        .then(() => {
          const commits = store.commit.getCalls();

          expect(api.getList).to.have.been.calledWith(prefix, listName);
          expect(commits[0].args).to.deep.eql([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1].args[0]).to.deep.eql(LIST_LOAD_FAIL);
        });
    });
  });

  describe('updateList', () => {
    const fn = lib.updateList,
      prefix = 'domain.com',
      listName = 'listName';

    test('allows arbitrary transforms on list items', () => {
      const store = {
        commit: sinon.spy(),
        state: {
          site: {
            prefix
          }
        }
      };

      api.getList.returns(Promise.resolve([]));
      api.saveList.returns(Promise.resolve([1, 2, 3]));
      return fn(store, { listName: listName, fn: () => [1, 2, 3] }).then(() => {
        expect(api.saveList).to.have.been.calledWith(prefix, listName, [1, 2, 3]);
      });
    });
  });
});
