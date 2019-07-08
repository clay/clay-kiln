import _ from 'lodash';
import labelUtil from '../../utils/label';
import {
  forEachComponent, forEachField, labelComponent, isValid
} from '../helpers';

export const label = 'Required',
  description = 'Some fields are required for publication',
  type = 'error';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    // note: explicitly check that this isn't a conditional-required field
    if (_.get(field, 'validate.required') === true && !isValid(field, componentData, 'required')) {
      errors.push({
        uri,
        field: _.head(field.path.split('.')), // todo: deep complex-list paths in the ui
        location: `${labelComponent(uri)} » ${labelUtil(field.name, field.schema)}`
      });
    }
  }));

  return errors;
}
