import _ from 'lodash';
import { getSchema } from '../core-data/components';
import { groupsProp } from './references';

function getGroupPath(field, schema) {
  // find the field in a group
  if (schema && schema[groupsProp]) {
    return _.findKey(schema[groupsProp], (group) => {
      // remove site specificity before matching against fields
      const bareFields = _.map(group.fields, f => f.replace(/\s?\(.*?\)\s?/, ''));

      return _.includes(bareFields, field);
    });
  }
}

/**
 * get the editable path from a uri and field
 * e.g. if the field is in a group, grab that group so we can open a form with the whole group
 * rather than the individual field
 * @param  {[type]} uri   [description]
 * @param  {[type]} field [description]
 * @return {[type]}       [description]
 */
export default function getPathFromField(uri, field) {
  const schema = getSchema(uri);

  // if the field is inside a group (including `settings`), return the group
  // otherwise return the field itself
  return getGroupPath(field, schema) || field;
}
