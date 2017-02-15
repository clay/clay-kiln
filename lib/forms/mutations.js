import _ from 'lodash';
import { OPEN_FORM, CLOSE_FORM } from './mutationTypes';

export default {
  [OPEN_FORM]: (state, { uri, path, fields, schema }) => {
    _.set(state, 'ui.currentForm', { uri, path, fields, schema });
    return state;
  },
  [CLOSE_FORM]: (state) => {
    _.set(state, 'ui.currentForm', null);
    return state;
  }
};
