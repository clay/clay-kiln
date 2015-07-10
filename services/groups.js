var _ = require('lodash');

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

module.exports.expandFields = expandFields;
