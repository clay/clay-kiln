import Vue from 'vue';
import {
  LIST_LOAD_PENDING,
  LIST_LOAD_SUCCESS,
  LIST_LOAD_FAIL
} from './mutationTypes';

export default {
  [LIST_LOAD_PENDING]: (state, {listName}) => {
    Vue.set(state, listName, {
      isLoading: true,
      error: null,
      items: []
    });
    return state;
  },
  [LIST_LOAD_SUCCESS]: (state, {listName, listItems}) => {
    Vue.set(state, listName, {
      isLoading: false,
      error: null,
      items: listItems
    });
    return state;
  },
  [LIST_LOAD_FAIL]: (state, {listName, error}) => {
    Vue.set(state, listName, {
      isLoading: false,
      error: {
        object: error,
        message: error.message
      },
      items: []
    });
    return state;
  }
};
