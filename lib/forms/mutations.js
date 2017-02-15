import _ from 'lodash';
import { OPEN_FORM, CLOSE_FORM, UPDATE_FORMDATA } from './mutationTypes';

export default {
  [OPEN_FORM]: (state, { uri, path, fields, schema }) => {
    _.set(state, 'ui.currentForm', { uri, path, fields, schema });
    return state;
  },
  [CLOSE_FORM]: (state) => {
    _.set(state, 'ui.currentForm', null);
    return state;
  },
  [UPDATE_FORMDATA]: (state, { path, data }) => {
    _.set(state, `ui.currentForm.data.${path}`, data);
    return state;
  }
};
