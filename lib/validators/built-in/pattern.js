import _ from 'lodash';
import labelUtil from '../../utils/label';
import {
  forEachComponent, forEachField, labelComponent, isValid
} from '../helpers';

export const label = 'Pattern',
  description = 'Some fields must be formatted in a specific way',
  type = 'error';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    if (!isValid(field, componentData, 'pattern')) {
      errors.push({
        uri,
        field: _.head(field.path.split('.')), // todo: deep complex-list paths in the ui
        location: `${labelComponent(uri)} » ${labelUtil(field.name, field.schema)}`,
        preview: _.get(field, 'validate.patternMessage')
      });
    }
  }));

  return errors;
}
