import _ from 'lodash';
import { decode } from 'he';
import striptags from 'striptags';
import { getComponentName, fieldProp, behaviorKey } from '../../utils/references';
import labelUtil from '../../utils/label';
import { getBehavior } from '../helpers';

export const label = 'Max Length',
  description = 'Some fields must be less than a certain length for consistent formatting across all syndications',
  type = 'error';

/**
 * decode and strip html tags from text,
 * so we can get an accurate length measurement
 * @param  {string} value
 * @return {string}
 */
function cleanValue(value) {
  return decode(striptags(value));
}

export function validate(state) {
  return _.reduce(state.components, (result, component, uri) => {
    _.forOwn(component, (val, key) => {
      const name = getComponentName(uri),
        schema = _.get(state, `schemas[${name}][${key}]`),
        softMaxlength = getBehavior('soft-maxlength', schema);

      if (_.isString(val) && softMaxlength) {
        const cleanVal = cleanValue(val);

        // assume that we're only checking strings, and that the soft-maxlength behavior will only be
        // in behavior ARRAYS (since it requires other behaviors in that field, and always has a value argument)
        if (cleanVal.length > softMaxlength.args.value) {
          result.push({
            uri,
            field: key,
            location: `${labelUtil(name)} » ${labelUtil(key, schema)}`,
            preview: _.truncate(`…${cleanVal.substr(softMaxlength.args.value)}`, {
              length: 40,
              omission: '…'
            })
          });
        }
      }
    });

    return result;
  }, []);
}
