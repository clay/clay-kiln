import _ from 'lodash';
import { labelProp } from './references';

/**
 * remove "clay-" from names
 * so labels for each npm component don't all start with "Clay ..."
 * @param {string} name
 * @returns {string}
 */
function dropClay(name) {
  return name.replace(/^clay\-/i, '');
}

/**
 * get label
 * if _label exists, use it
 * else get the name of the field/group, prettified
 * e.g. "mediaplay-image" would become "Mediaplay Image"
 * @param  {string} name
 * @param  {object} schema
 * @return {string}
 */
export default function label(name, schema) {
  var label = schema && schema[labelProp];

  if (label) {
    return label;
  } else {
    return dropClay(name).split('-').map(_.startCase).join(' '); // split on hyphens
  }
};
