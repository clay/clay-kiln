import _ from 'lodash';
import { getComponentName, fieldProp } from '../../utils/references';
import labelUtil from '../../utils/label';
import { isEmpty } from '../../utils/comparators';

export const label = 'Required',
  description = 'Some fields are required for publication',
  type = 'error';

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    if (!_.isEmpty(component)) {
      // if a component has been deleted, the representation in the store will be an empty object.
      // this allows decorators and such to not fail, but we need to be aware of it
      // when validating the component's data
      // (because we want to validate against fields that are missing from the data)
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
    }

    return result;
  }, []);
}
