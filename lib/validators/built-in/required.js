import _ from 'lodash';
import { getComponentName } from '../../utils/references';
import labelUtil from '../../utils/label';
import { isEmpty } from '../../utils/comparators';
import { getValidation, getListProps } from '../helpers';

export const label = 'Required',
  description = 'Some fields are required for publication',
  type = 'error';

function hasEmptyRequiredListItems(val, fieldSchema) {
  const props = getListProps(fieldSchema);

  // look through the complex-list props for anything that's required,
  // then look through the field's data seeing if that prop is empty
  return !!_.find(props, (propConfig) => getValidation('required', propConfig) === true && !!_.find(val, (item) => isEmpty(item[propConfig.prop])));
}

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
        const requiredInput = getValidation('required', fieldSchema);

        if (_.get(requiredInput, 'validate.required') === true) {
          const val = component[fieldName];

          // this field is required! check the component data
          if (isEmpty(val) || hasEmptyRequiredListItems(val, fieldSchema)) {
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
