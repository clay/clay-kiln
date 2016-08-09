const _ = require('lodash'),
  pattern = /\${\s*(\w+)\s*}/ig; // allows field value in text, e.g. 'The value is ${fieldName}'

/**
 * get a field's value
 * @param {string} fieldName
 * @param {object} componentData
 * @returns {String}
 */
function getFieldVal(fieldName, componentData) {
  var fieldData = _.get(componentData, fieldName),
    val = fieldData && fieldData.value;

  if (val !== undefined) { // accept falsy values, because we want to cast them to strings
    if (_.isString(val)) {
      return val;
    } else if (_.isNumber(val)) {
      return val.toString(); // explicitly return '0' for 0, not falsy value
    } else if (_.isBoolean(val)) {
      return val.toString(); // explicitly return 'true'/'false', not falsy value
    }
  } else {
    // no .value, means this is an object or array
    if (_.isArray(fieldData) && !_.isObject(fieldData[0])) {
      return fieldData.join(', ');
    } // we don't support objects or arrays of objects
    // todo: add support for listing component names in lists/properties
  }
}

/**
 * replace matched field name with field value
 * @param {object} componentData
 * @returns {Function}
 */
function replaceFieldName(componentData) {
  // always return a string; we cannot rely on the `toString` method as it can throw errors
  return (match, fieldName) => new String(getFieldVal(fieldName, componentData) || ''); // default to empty string
}

module.exports = function (str, componentData) {
  return str.replace(pattern, replaceFieldName(componentData));
};

_.set(window, 'kiln.services[interpolate-fields]', module.exports); // export for plugins
