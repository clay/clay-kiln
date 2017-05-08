import _ from 'lodash';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';

export default {
  [LIST_LOAD_PENDING]: (state, { listName }) => {
    _.set(state, `lists[${listName}]`, {
      isLoading: true,
      error: null,
      items: []
    });
    return state;
  },
  [LIST_LOAD_SUCCESS]: (state, { listName, listItems }) => {
    _.set(state, `lists[${listName}]`, {
      isLoading: false,
      error: null,
      items: listItems
    });
    return state;
  },
  [LIST_LOAD_FAIL]: (state, { listName, error }) => {
    _.set(state, `lists[${listName}]`, {
      isLoading: false,
      error: error,
      items: []
    });
    return state;
  }
};
