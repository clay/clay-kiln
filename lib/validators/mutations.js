import _ from 'lodash';
import { UPDATE_VALIDATION } from './mutationTypes';

export default {
  [UPDATE_VALIDATION]: (state, validationState) => {
    _.set(state, 'validation', validationState);

    return state;
  }
};
