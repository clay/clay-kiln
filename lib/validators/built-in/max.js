import _ from 'lodash';
import labelUtil from '../../utils/label';
import {
  forEachComponent, forEachField, labelComponent, isValid, getPlaintextValue
} from '../helpers';

export const label = 'Max',
  description = 'Some fields must be less than a certain length (or value)',
  type = 'error';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    if (!isValid(field, componentData, 'max') && field.type === 'component-list') {
      errors.push({
        uri,
        location: `${labelComponent(uri)} » ${labelUtil(field.name)}`
      });
    } else if (!isValid(field, componentData, 'max')) {
      errors.push({
        uri,
        field: _.head(field.path.split('.')), // todo: deep complex-list paths in the ui
        location: `${labelComponent(uri)} » ${labelUtil(field.name, field.schema)}`,
        preview: _.truncate(`…${getPlaintextValue(field.value).substr(_.get(field, 'validate.max'))}`, {
          length: 40,
          omission: '…'
        })
      });
    }
  }));

  return errors;
}
