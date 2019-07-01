import _ from 'lodash';
import labelUtil from '../../utils/label';
import {
  forEachComponent, forEachField, labelComponent, isValid, getPlaintextValue
} from '../helpers';

export const label = 'Minimum',
  description = 'Some fields must be more than a certain length (or value)',
  type = 'error';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    if (!isValid(field, componentData, 'min') && field.type === 'component-list') {
      errors.push({
        uri,
        location: `${labelComponent(uri)} » ${labelUtil(field.name)}`
      });
    } else if (!isValid(field, componentData, 'min')) {
      errors.push({
        uri,
        field: _.head(field.path.split('.')), // todo: deep complex-list paths in the ui
        location: `${labelComponent(uri)} » ${labelUtil(field.name, field.schema)}`,
        preview: getPlaintextValue(field.value)
      });
    }
  }));

  return errors;
}
