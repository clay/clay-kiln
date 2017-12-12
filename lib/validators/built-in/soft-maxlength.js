import _ from 'lodash';
import labelUtil from '../../utils/label';
import { forEachComponent, forEachField, labelComponent, isValid } from '../helpers';

export const label = 'Max Length',
  description = 'Some fields must be less than a certain length for consistent formatting across all syndications',
  type = 'error';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    if (_.get(field, 'validate.max') && !isValid(field, componentData)) {
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
