import _ from 'lodash';
import { UPDATE_PAGE_STATE, UPDATE_PAGEURI } from './mutationTypes';

export default {
  [UPDATE_PAGE_STATE]: (state, pageState) => {
    state.page.state = _.assign({}, state.page.state, pageState);

    return state;
  },
  [UPDATE_PAGEURI]: (state, uri) => {
    state.page.uri = uri;

    return state;
  }
};
