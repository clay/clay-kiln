import _ from 'lodash';
import { OPEN_FORM, CLOSE_FORM, UPDATE_FORMDATA } from './mutationTypes';
import { fromDotNotation, toDotNotation } from '../utils/field-path';

export default {
  [OPEN_FORM]: (state, { uri, path, inline, fields, schema, initialOffset, appendText, pos, initialFocus }) => {
    _.set(state, 'ui.currentForm', { uri, path, inline, fields, schema, initialOffset, appendText, pos, initialFocus });
    return state;
  },
  [CLOSE_FORM]: (state) => {
    _.set(state, 'ui.currentForm', null);
    return state;
  },
  [UPDATE_FORMDATA]: (state, { path, data }) => {
    const pathArr = toDotNotation(path).split('.'),
      fields = _.get(state, 'ui.currentForm.fields'),
      uri = _.get(state, 'ui.currentForm.uri');

    _.forEach(pathArr, (part, index) => {
      const currentPath = _.take(pathArr, index + 1).join('.');

      if (typeof _.get(fields, currentPath) === 'undefined') {
        // before updating the data in the current form, we should check if that data exists
        // in the current form. this prevents us from getting into weird situations when
        // setting individual indices on otherwise undefined arrays
        // (we merge in the current component data for those, THEN set the form data)
        _.set(fields, currentPath, _.get(state, `components['${uri}'].${currentPath}`));
      }
    });

    _.set(fields, `${fromDotNotation(path)}`, data);

    return state;
  }
};
