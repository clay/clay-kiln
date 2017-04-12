import {
  LIST_LOAD_PENDING,
  LIST_LOAD_SUCCESS,
  LIST_LOAD_FAIL
} from './mutationTypes';
import {
  getList as getListFromAmphora
} from '../core-data/amphora-api';

/**
 * @param {object} store
 * @param {object} state
 * @param {object} payload
 * @returns {Promise}
 */
const getList = (store, {prefix, listName}, getListFunction = getListFromAmphora) => {
  store.commit(LIST_LOAD_PENDING, {listName});
  return getListFunction(prefix, listName)
          .then(listItems => store.commit(LIST_LOAD_SUCCESS, {listItems, listName}))
          .catch(error => store.commit(LIST_LOAD_FAIL, {listName, error}));
};


export default {
  getList
};
