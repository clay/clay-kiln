import _ from 'lodash';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';
import { getList as getListFromAmphora } from '../core-data/amphora-api';

export function getList(store, listName) {
  const prefix = _.get(store, 'state.site.prefix');

  store.commit(LIST_LOAD_PENDING, { listName });
  return getListFromAmphora(prefix, listName)
    .then((listItems) => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    .catch((error) => store.commit(LIST_LOAD_FAIL, { listName, error }));
}
