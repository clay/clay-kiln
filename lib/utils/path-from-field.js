import _ from 'lodash';
import { getSchema } from '../core-data/components';
import { groupsProp } from './references';

function getGroupPath(field, schema) {
  // find the field in a group
  // note: this will find it in a manually-specified settings group
  // if the field doesn't itself have _display: settings
  if (schema[groupsProp]) {
    return _.findKey(schema[groupsProp], (group) => _.includes(group.fields, field));
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

  // if it's a field in settings, return settings (easiest check)
  // otherwise see if it's in a group
  // otherwise return the field itself
  return getGroupPath(field, schema) || field;
}
