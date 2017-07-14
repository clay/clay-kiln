import _ from 'lodash';
import { getComponentName, fieldProp } from '../../utils/references';
import labelUtil from '../../utils/label';
import { isEmpty } from '../../utils/comparators';

export const label = 'Required',
  description = 'Some fields are required for publication',
  type = 'error';

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    const name = getComponentName(uri),
      schema = _.get(state, `schemas[${name}]`);

    _.forOwn(schema, (fieldSchema, fieldName) => {
      const behaviors = fieldSchema[fieldProp];

      // 'required' has no arguments and must be included with other behaviors in the field,
      // so we can make some assumptions to make this check more efficient
      if (_.isArray(behaviors) && _.includes(behaviors, 'required')) {
        const val = component[fieldName];

        // this field is required! check the component data
        if (isEmpty(val)) {
          result.push({
            uri,
            field: fieldName,
            location: `${labelUtil(name)} » ${labelUtil(fieldName, schema)}`
          });
        }
      }
    });

    return result;
  }, []);
}
