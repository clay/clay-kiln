var _ = require('lodash'),
  references = require('@nymdev/references');

/**
 * True if value has a property called fields.
 * @param {*} value
 * @returns {boolean}
 */
function hasFields(value) {
  return value && !!value.fields;
}

/**
 * Groups combine multiple fields together.  Works directly on data object given.
 *
 * Note: we're not assuming that schema is attached to data as an attempt to avoid future issues if we refactor later.
 *
 * @param {object} data
 * @param {object} schema
 * @returns {object} data with group fields
 */
function addGroupFieldsToData(data, schema) {
  // only groups that have fields are valid (avoid the if statement)
  var groupFields,
    groups = _.pick(schema[references.groupsProperty], hasFields);

  groupFields = _.transform(groups, function (obj, group, name) {
    obj[name] = {
      value: _.map(group.fields, function (fieldName) {
        return data[fieldName];
      }),
      _schema: _.assign({ _name: name }, group)
    };
  });

  return _.assign(groupFields, data);
}

/**
 * Note: we're not assuming that schema is attached to data as an attempt to avoid future issues if we refactor later.
 *
 * @param {object} data
 * @param {object} schema
 * @returns {object} data without group fields
 */
function removeGroupFieldsFromData(data, schema) {
  var groups = schema[references.groupsProperty],
    groupKeys = groups && Object.keys(schema[references.groupsProperty]);

  // if we did work, return clone with groups removed; otherwise
  //  return original -- because groups might be rare, avoid unneeded work.
  return groupKeys && _.omit(data, groupKeys) || data;
}

module.exports.add = addGroupFieldsToData;
module.exports.remove = removeGroupFieldsFromData;
