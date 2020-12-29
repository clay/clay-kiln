import _ from 'lodash';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';
import { getList as getListFromAPI, saveList, patchList as patchListAPI } from '../core-data/api';

/**
 * @module lists
 */

export function getList(store, listName) {
  const prefix = _.get(store, 'state.site.prefix');

  store.commit(LIST_LOAD_PENDING, { listName });

  return getListFromAPI(prefix, listName)
    .then(listItems => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}

export function updateList(store, { listName, fn }) {
  const prefix = _.get(store, 'state.site.prefix');

  store.commit(LIST_LOAD_PENDING, { listName });

  return getListFromAPI(prefix, listName)
    // TODO check this error and make sure its a 404 before returning an empty array
    .catch(() => []) // allow adding to a new list
    .then(listItems => fn(_.cloneDeep(listItems)))
    .then(listItems => saveList(prefix, listName, listItems))
    .then(listItems => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}

export function patchList(store, { listName, fn }) {
  const prefix = _.get(store, 'state.site.prefix');

  store.commit(LIST_LOAD_PENDING, { listName });

  let existingList;

  // get the list
  return getListFromAPI(prefix, listName)
    // pass list to fn
    .then(list => {
      existingList = list;
      return fn(existingList);
    })
    // fn needs to return a patch `{ remove: [], add: [] }`
    .then(patch => patch && (patch.add || patch.remove) ? patchListAPI(prefix, listName, patch) : existingList)
    // patch api returns full list
    .then(listItems => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    // catch and log errors
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}
