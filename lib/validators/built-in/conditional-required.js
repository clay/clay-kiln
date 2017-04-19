import _ from 'lodash';
import { getComponentName, fieldProp } from '../../utils/references';
import labelUtil from '../../utils/label';
import { isEmpty, compare } from '../../utils/comparators';

export const label = 'Conditionally Required',
  description = 'Some fields are required for publication, based on other fields',
  type = 'error';

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      if (isEmpty(val)) {
        // first, check empty values. if it's empty, then we should
        // look in the schema to see if it was required
        const name = getComponentName(uri),
          schema = _.get(state, `schemas[${name}][${key}]`),
          behaviors = schema && schema[fieldProp],
          conditionalRequired = _.isArray(behaviors) && _.find(behaviors, { fn: 'conditional-required' });

        if (conditionalRequired) {
          // check the field it's based on, to see if it's actually required here
          const compareField = conditionalRequired.field,
            compareSchema = _.get(state, `schemas[${name}][${compareField}]`),
            compareData = _.get(component, compareField),
            shouldBeRequired = compare({ data: compareData, operator: conditionalRequired.operator, value: conditionalRequired.value });

          if (shouldBeRequired) {
            result.push({
              uri,
              field: key,
              location: `${labelUtil(name)} » ${labelUtil(key, schema)}`,
              preview: `(based on ${labelUtil(compareField, compareSchema)})`
            });
          }
        }
      }
    });

    return result;
  }, []);
}
