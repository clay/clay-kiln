var _ = require('lodash'),
  references = require('./references');

/**
 * get label
 * if _label exists, use it
 * else get the name of the field/group, prettified
 * e.g. "title.social" would become "Title » Social"
 * @param  {string} name
 * @param  {object} schema
 * @return {string}
 */
module.exports = function (name, schema) {
  var label = schema && schema[references.labelProperty];

  return _.isString(label) ? label : name.split('.').map(_.startCase).join(' » ');
};
