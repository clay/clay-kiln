var _ = require('lodash'),
  references = require('./references');

/**
 * expand fields array
 * @param {array} fields
 * @param {object} componentData
 * @returns {array} expanded
 */
function expandFields(fields, componentData) {
  if (!_.isArray(fields)) {
    throw new Error('Please provide an array of fields!');
  }

  return _.map(fields, function (field) {
    var expanded = {
      field: field,
      data: _.get(componentData, field)
    };

    if (!expanded.data) {
      throw new Error('Field (' + field + ') doesn\'t exist in the schema!');
    }

    return expanded;
  });
}

/**
 * get only the fields with _display: settings
 * @param {object} componentData
 * @returns {array}
 */
function getSettingsGroup(componentData) {
  if (!_.isObject(componentData) || _.isEmpty(componentData)) {
    return [];
  }

  return _.reduce(componentData, function (fields, fieldData, fieldName) {
    if (fieldData._schema && fieldData._schema[references.displayProperty] === 'settings') {
      fields.push({
        field: fieldName,
        data: fieldData
      });
    }

    return fields;
  }, []);
}

module.exports.expandFields = expandFields;
module.exports.getSettingsGroup = getSettingsGroup;
