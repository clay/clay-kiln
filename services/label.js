var _ = require('lodash'),
  references = require('./references');

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
module.exports = function (name, schema) {
  var label = schema && schema[references.labelProperty];

  if (label) {
    return label;
  } else {
    return dropClay(name).split('-').map(_.startCase).join(' '); // split on hyphens
  }
};

_.set(window, 'kiln.services.label', module.exports); // export for plugins
