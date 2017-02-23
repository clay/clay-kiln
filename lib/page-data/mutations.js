import _ from 'lodash';
import { PAGE_SAVE_PENDING, PAGE_SAVE_FAILURE } from './mutationTypes';

export default {
  [PAGE_SAVE_PENDING]: (state, data) => {
    _.set(state, 'page.data', data);
    return state;
  },
  [PAGE_SAVE_FAILURE]: (state, oldData) => {
    _.set(state, 'page.data', oldData);
    // todo: set something that shows the error
    return state;
  }
};
