import Vue from 'vue';
import _ from 'lodash';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';

export default {
  [LIST_LOAD_PENDING]: (state, { listName }) => {
    // use vue setter for lists, as individual lists won't have objects when the state is preloaded
    Vue.set(state.lists, listName, {
      isLoading: true,
      error: null,
      items: _.get(state.lists, `${listName}.items`, []) // don't clear list items if they already exist
    });

    return state;
  },
  [LIST_LOAD_SUCCESS]: (state, { listName, listItems }) => {
    Vue.set(state.lists, listName, {
      isLoading: false,
      error: null,
      items: listItems
    });

    return state;
  },
  [LIST_LOAD_FAIL]: (state, { listName, error }) => {
    Vue.set(state.lists, listName, {
      isLoading: false,
      error: error,
      items: []
    });

    return state;
  }
};
