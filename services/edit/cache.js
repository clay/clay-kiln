/**
 * NOTE:  Only things related to _caching_ or things that should be cached go here.
 *
 * Group fields and Schema fields are cached, so they go here.
 *
 * @module
 */

var _ = require('lodash'),
  db = require('./db'),
  references = require('../references'),
  groupFields = require('./group-fields'),
  schemaFields = require('./schema-fields'),
  control = require('./control'),
  schemaKeywords = ['_groups'];

/**
 * Convert to plain data (no groups, no schema, no _ref).
 *
 * Clones so original object passed in is not affected.
 *
 * @param {string} uri
 * @param {object} data
 * @returns {object}
 */
function removeExtras(uri, data) {
  return exports.getSchema(uri).then(function (schema) {
    data = _.cloneDeep(data);
    data = groupFields.remove(data, schema);
    data = schemaFields.remove(data);
    delete data[references.referenceProperty];
    return data;
  });
}

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
 * Get data for a component combined with schema.
 *
 * NOTE: Some components are read-only and cannot be edited.
 *
 * @param {string} uri
 * @throws Error if uri cannot be edited because of a missing schema
 * @returns {Promise}
 */
function getData(uri) {
  return Promise.all([exports.getSchema(uri), exports.getDataOnly(uri)]).then(function (res) {
    var schema = _.cloneDeep(res[0]),
      data = schemaFields.add(schema, _.cloneDeep(res[1]));

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
  return db.getSchema(uri).then(function (schema) {
    addNameToFieldsOfSchema(schema);
    return schema;
  });
}

/**
 * @param {object} data
 * @returns {Promise}
 */
function saveThrough(data) {
  var uri = data[references.referenceProperty];

  return removeExtras(uri, data).then(function (data) {
    return db.save(uri, data);
  }).then(function (result) {
    // only clear cache if save is successful
    exports.getData.cache = new _.memoize.Cache();
    exports.getDataOnly.cache = new _.memoize.Cache();

    // remember new value (it is returned when save is successful; common with REST implementations)
    result[references.referenceProperty] = uri;
    control.setReadOnly(result);
    exports.getDataOnly.cache.set(uri, result);

    // cache version with schema, return version with schema
    return exports.getData(uri);
  });
}

function createThrough(uri, data) {
  // convert to plain data (no groups, no schema, no _ref)
  return removeExtras(uri, data).then(function (data) {
    return db.create(uri, data);
  }).then(function (result) {
    var selfReference = result._ref || result._self;

    // only clear cache if save is successful
    exports.getData.cache = new _.memoize.Cache();
    exports.getDataOnly.cache = new _.memoize.Cache();

    // remember new value (it is returned when creation is successful; common with REST implementations)
    if (!selfReference) {
      throw new Error('Created, but we do not know where.');
    }

    control.setReadOnly(result);
    exports.getDataOnly.cache.set(selfReference, result);

    // cache version with schema, return version with schema
    return exports.getData(selfReference);
  });
}

// remembers
exports.getData = control.memoizePromise(getData);
exports.getDataOnly = control.memoizePromise(getDataOnly);
exports.getSchema = control.memoizePromise(getSchema);

// forgets
exports.saveThrough = saveThrough;
exports.createThrough = createThrough;
