import _ from 'lodash';

// allows field value in text, e.g. 'The value is ${fieldName}'
// note: this ONLY interpolates field names to their values.
// it doesn't allow arbitrary js like template literals do
const pattern = /\${\s*(\w+)\s*}/ig;

function recursivelyGetValue(val) {
  if (val !== undefined) { // accept falsy values, because we want to cast them to strings
    if (_.isString(val)) {
      return val; // pass through string values
    } else if (_.isNumber(val)) {
      return val.toString(); // explicitly return '0' for 0, not falsy value
    } else if (_.isBoolean(val)) {
      return val.toString(); // explicitly return 'true'/'false', not falsy value
    } else if (_.isRegExp(val)) {
      return val.toString(); // get string representation of regex
    } else if (_.isArray(val)) {
      return _.map(val, (item) => recursivelyGetValue(item)).join(', '); // get value for each item, then join them together
    } else if (_.isObject(val)) {
      return _.map(val, (item, key) => `${key}: ${recursivelyGetValue(item)}`).join(', '); // get value for each item, then join them together
    }
  } else {
    return ''; // return empty string if value is undefined
  }
}

/**
 * get a field's value
 * @param {string} fieldName
 * @param {object} componentData
 * @returns {String}
 */
function getFieldValue(fieldName, componentData) {
  const val = componentData[fieldName];

  return recursivelyGetValue(val);
}

/**
 * replace matched field name with field value
 * @param {object} componentData
 * @returns {Function}
 */
function replaceFieldName(componentData) {
  // always return a string; we cannot rely on the `toString` method as it can throw errors
  return (match, fieldName) => new String(getFieldValue(fieldName, componentData) || ''); // default to empty string
}

/**
 * replace all ${fieldName}'s in a string with data from those fields
 * @param  {string} str
 * @param  {object} componentData
 * @return {string}
 */
export default function interpolate(str, componentData) {
  return str.replace(pattern, replaceFieldName(componentData));
}
