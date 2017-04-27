import _ from 'lodash';
import { UPDATE_PAGESTATE, UPDATE_PAGEURI } from './mutationTypes';

export default {
  [UPDATE_PAGESTATE]: (state, pageState) => {
    _.assign(state.page.state, pageState);
    return state;
  },
  [UPDATE_PAGEURI]: (state, uri) => {
    state.page.uri = uri;
    return state;
  }
};
