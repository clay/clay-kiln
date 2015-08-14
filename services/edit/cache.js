var _ = require('lodash'),
  db = require('../db'),
  references = require('../references'),
  groupFields = require('./group-fields'),
  schemaFields = require('./schema-fields'),
  control = require('./control'),
  schemaKeywords = ['_groups'];

/**
 * Add _name property to each field definition on the first-level of a schema.
 *
 * Note: In-place edit of schema object
 *
 * @param {object} schema
 */
function addNameToFieldsOfSchema(schema) {
  _.each(schema, function (definition, name) {
    if (!_.contains(schemaKeywords, name) && _.isObject(definition)) {
      definition._name = name;
    }
  });
}

/**
 * Get data for a component.
 *
 * @param {string} uri
 * @returns {Promise}
 */
function getDataOnly(uri) {
  return db.get(uri).then(function (data) {

    // add this here to be nice, let the value be cached
    data[references.referenceProperty] = uri;

    return data;
  });
}

/**
 * Get data for a component combined with schema
 *
 * @param {string} uri
 * @returns {Promise}
 */
function getData(uri) {
  return Promise.all([getSchema(uri), getDataOnly(uri)]).then(function (res) {
    var schema = res[0],
      data = schemaFields.add(schema, res[1]);

    addNameToFieldsOfSchema(schema);
    data = groupFields.add(data, schema);
    return data;
  });
}

/**
 * Get schema for a component.
 *
 * @param {string} uri
 * @returns {Promise}
 */
function getSchema(uri) {
  return db.getSchema(uri);
}

/**
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
function saveThrough(uri, data) {
  return db.save(uri, data).then(function (result) {
    // only clear cache if save is successful
    exports.getData.cache = new_.memoize.Cache();
    exports.getDataOnly.cache = new_.memoize.Cache();

    // remember new value (it is returned when save is successful; common with REST implementations)
    exports.getData.cache.set(uri, result);

    // cache version with schema, return version with schema
    return getData(uri);
  });
}

// remembers
exports.getData = control.memoizePromise(getData);
exports.getDataOnly = control.memoizePromise(getDataOnly);
exports.getSchema = control.memoizePromise(getSchema);

// forgets
exports.saveThrough = saveThrough;
