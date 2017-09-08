import _ from 'lodash';
import { getComponentName, fieldProp } from '../../utils/references';
import labelUtil from '../../utils/label';
import { isEmpty, compare } from '../../utils/comparators';
import { getBehavior, hasBehavior, getListProps } from '../helpers';

export const label = 'Conditionally Required',
  description = 'Some fields are required for publication, based on other fields',
  type = 'error';

function hasEmptyRequiredListItems(val, fieldSchema) {
  const props = getListProps(fieldSchema);

  // look through the complex-list props for anything that's required,
  // then look through the field's data seeing if that prop is empty
  return !!_.find(props, (propConfig) => hasBehavior('conditional-required', propConfig) && !!_.find(val, (item) => isEmpty(item[propConfig.prop])));
}

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      const name = getComponentName(uri),
        schema = _.get(state, `schemas[${name}][${key}]`);

      if (isEmpty(val) || hasEmptyRequiredListItems(val, schema)) {
        // first, check empty values. if it's empty, then we should
        // look in the schema to see if it was required
        const conditionalRequired = getBehavior('conditional-required', schema),
          compareField = conditionalRequired && conditionalRequired.args.field;

        let compareSchema, emptyItemIndex, compareData, shouldBeRequired;

        if (conditionalRequired && conditionalRequired._path) {
          // check the list item OR field it's based on, to see if it's required
          compareSchema = _.find(_.get(getBehavior('complex-list', schema), 'args.props'), (prop) => prop.prop === compareField);
          emptyItemIndex = _.findIndex(val, (item) => isEmpty(item[conditionalRequired._path]));
          compareData = _.get(val, `${emptyItemIndex}.${compareField}`);
        }

        if (conditionalRequired) {
          // check the field it's based on, to see if it's actually required here
          compareSchema = compareSchema || _.get(state, `schemas[${name}][${compareField}]`);
          compareData = compareData || _.get(component, compareField);
          shouldBeRequired = compare({ data: compareData, operator: conditionalRequired.args.operator, value: conditionalRequired.args.value });

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
