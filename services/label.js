var _ = require('lodash'),
  references = require('./references');

/**
 * get label
 * if _label exists, use it
 * else get the name of the field/group, prettified
 * e.g. "mediaplay-image" would become "Mediaplay Image"
 * @param  {string} name
 * @param  {object} schema
 * @return {string}
 */
module.exports = function (name, schema) {
  var label = schema && schema[references.labelProperty];

  if (label) {
    return label;
  } else {
    return name.split('-').map(_.startCase).join(' '); // split on hyphens
  }
};
