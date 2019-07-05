import _ from 'lodash';
import labelUtil from '../../utils/label';
import {
  forEachComponent, forEachField, labelComponent, isValid, getSchema
} from '../helpers';

export const label = 'Conditionally Required',
  description = 'Some fields are required for publication, based on other fields',
  type = 'error';

export function validate(state) {
  let errors = [];

  forEachComponent(state, (componentData, uri) => forEachField(state, componentData, uri, (field) => {
    // note: explicitly check that this isn't a regular required field
    if (!isValid(field, componentData, 'conditional-required')) {
      const compareField = _.get(field, 'validate.required.field'),
        compareSchema = _.get(getSchema(state, uri), compareField);

      errors.push({
        uri,
        field: _.head(field.path.split('.')), // todo: deep complex-list paths in the ui
        location: `${labelComponent(uri)} » ${labelUtil(field.name, field.schema)}`,
        preview: `(based on ${labelUtil(compareField, compareSchema)})`
      });
    }
  }));

  return errors;
}
