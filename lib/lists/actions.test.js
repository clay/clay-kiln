import * as lib from './actions';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';
import * as api from '../core-data/api';

jest.mock('../core-data/api');

describe('list actions', () => {
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
        commit: jest.fn(),
        state: {
          site: {
            prefix
          }
        }
      };

      api.getList.mockResolvedValue(successPayload.listItems);

      return fn(store, listName)
        .then(() => {
          const commits = store.commit.mock.calls;

          expect(api.getList).toHaveBeenCalledWith(prefix, listName);
          expect(commits[0]).toEqual([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1]).toEqual([LIST_LOAD_SUCCESS, successPayload]);
        });
    });

    test('can pend, then fail', () => {
      const store = {
        commit: jest.fn(),
        state: {
          site: {
            prefix
          }
        }
      };

      api.getList.mockRejectedValue(errorPayload);

      return fn(store, listName)
        .then(() => {
          const commits = store.commit.mock.calls;

          expect(api.getList).toHaveBeenCalledWith(prefix, listName);
          expect(commits[0]).toEqual([LIST_LOAD_PENDING, pendingPayload]);
          expect(commits[1][0]).toEqual(LIST_LOAD_FAIL);
        });
    });
  });

  describe('updateList', () => {
    const fn = lib.updateList,
      prefix = 'domain.com',
      listName = 'listName';

    test('allows arbitrary transforms on list items', () => {
      const store = {
        commit: jest.fn(),
        state: {
          site: {
            prefix
          }
        }
      };

      api.getList.mockResolvedValue([]);
      api.saveList.mockResolvedValue([1, 2, 3]);

      return fn(store, { listName: listName, fn: () => [1, 2, 3] }).then(() => {
        expect(api.saveList).toHaveBeenCalledWith(prefix, listName, [1, 2, 3]);
      });
    });
  });
});
