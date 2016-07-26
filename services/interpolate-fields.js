const pattern = /\${\s*(\w+)\s*}/ig; // allows field value in text, e.g. 'The value is ${fieldName}'

/**
 * get a field's value
 * @param {string} fieldName
 * @param {object} data
 * @returns {String}
 */
function getFieldVal(fieldName, data) {
  var value = 'value';

  console.log('\n\n' + fieldName)
  console.log(data)
  // always return a string; we cannot rely on the `toString` method as it can throw errors
  return new String(_.get(data, value) || ''); // default to empty string
}

/**
 * replace matched field name with field value
 * @param {object} data
 * @returns {Function}
 */
function replaceFieldName(data) {
  return (match, fieldName) => getFieldVal(fieldName, data);
}

module.exports = function (str, data) {
  return str.replace(pattern, replaceFieldName(data));
};
