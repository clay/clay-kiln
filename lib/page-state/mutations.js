import _ from 'lodash';
import { UPDATE_PAGESTATE, UPDATE_PAGEURI, UPDATE_PAGE_LIST_DATA } from './mutationTypes';

export default {
  [UPDATE_PAGESTATE]: (state, pageState) => {
    _.assign(state.page.state, pageState);
    return state;
  },
  [UPDATE_PAGEURI]: (state, uri) => {
    state.page.uri = uri;
    return state;
  },
  [UPDATE_PAGE_LIST_DATA]: (state, data) => {
    _.assign(state.page.listData, data);
    return state;
  }
};
