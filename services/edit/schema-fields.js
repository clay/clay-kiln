var _ = require('lodash'),
  schemaKeywords = ['_ref', '_groups'];

/**
 * @param {object} schema
 * @param {object} data
 * @returns {object}
 */
function addSchemaToData(schema, data) {
  _.each(schema, function (schemaPart, key) {
    var propertyExists = _.has(data, key),
      value = data[key];

    if (_.isObject(schemaPart) && !_.contains(schemaKeywords, key)) {
      // if the key doesn't exist (value not just undefined, but the key as well) or value is any non-object
      if (!propertyExists || !_.isObject(value)) {
        data[key] = {
          _schema: schemaPart,
          value: value
        };
      } else {
        addSchemaToData(schemaPart, value);
      }
    }
  });

  data._schema = schema;
  return data;
}

/**
 * @param {object} data
 * @returns {object}
 */
function removeSchemaFromData(data) {
  if (!!data && data.hasOwnProperty('value') && !!data._schema && _.size(data) === 2) {
    // not an object anymore
    return data.value;
  } else if (_.isObject(data)) {
    // still an object
    delete data._schema;
    if (_.isArray(data)) {
      return _.map(data, removeSchemaFromData);
    } else {
      return _.mapValues(data, removeSchemaFromData);
    }

  } else {
    return data;
  }
}

module.exports.add = addSchemaToData;
module.exports.remove = removeSchemaFromData;
