import _ from 'lodash';
import { getComponentName, fieldProp } from '../../utils/references';
import labelUtil from '../../utils/label';

export const label = 'Required',
  description = 'Some fields are required for publication',
  type = 'error';

function isFieldEmpty(val) {
  if (_.isArray(val) || _.isObject(val)) {
    return _.isEmpty(val);
  } else if (_.isString(val)) {
    return val.length === 0; // emptystring is empty
  } else if (_.isNull(val) || _.isUndefined(val)) {
    return true; // null and undefined are empty
  } else {
    // numbers, booleans, etc are never empty
    return false;
  }
}

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      if (isFieldEmpty(val)) {
        // first, check empty values. if it's empty, then we should
        // look in the schema to see if it was required
        const name = getComponentName(uri),
          schema = _.get(state, `schemas[${name}][${key}]`),
          behaviors = schema && schema[fieldProp];

        if (_.isArray(behaviors) && _.includes(behaviors, 'required')) {
          // 'required' has no arguments and must be included with other behaviors in the field,
          // so we can make some assumptions to make this check more efficient
          result.push({
            uri,
            field: key,
            location: `${labelUtil(name)} » ${labelUtil(key, schema)}`
          });
        }
      }
    });

    return result;
  }, []);
}
