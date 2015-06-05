'use strict';
var _ = require('lodash'),
  db = require('./db'),
  references = require('./references'),
  // store the component data in memory
  refData = {},
  // store the component schemas in memory
  refSchema = {};

// todo: figure out multi-user edit, since this won't pull in changes correctly if
// multiple people are changing data in a component without page reloads

/**
 * @param {object} value
 */
function setSchemaCache(value) {
  refSchema = value;
}

/**
 * @param {object} value
 */
function setDataCache(value) {
  refData = value;
}

/**
 * get data for a component. cached on the client side
 * @param  {string}   ref
 * @returns {Promise}
 */
function getDataOnly(ref) {
  if (refData[ref]) {
    //clone because other people are modifying data, and we don't want to change the cache.
    return Promise.resolve(_.cloneDeep(refData[ref]));
  } else {
    return db.getComponentJSONFromReference(ref)
      .then(function (data) {
        //be nice, remember where this data is from
        data[references.referenceProperty] = ref;
        refData[ref] = data;
        return data;
      });
  }
}

/**
 * get schema for a component. cached on the client side
 * @param  {string}   ref
 * @returns  {Promise}
 */
function getSchema(ref) {
  if (refSchema[ref]) {
    return Promise.resolve(refSchema[ref]);
  } else {
    return db.getSchemaFromReference(ref)
      .then(function (schema) {
        refSchema[ref] = schema;
        return schema;
      });
  }
}

/**
 * @param {object} schema
 * @param {object} data
 * @returns {object}
 */
function addSchemaToData(schema, data) {
  _.each(data, function (value, key, list) {
    var schemaPart = schema[key];
    if (_.isObject(schemaPart)) {
      if (!_.isObject(value)) {
        list[key] = {
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

function getData(ref) {
  return Promise.all([getSchema(ref), getDataOnly(ref)]).then(function (res) {
    return addSchemaToData(res[0], res[1]);
  });
}

/**
 * @param data
 */
function removeSchemaFromData(data) {
  _.each(data, function (value, key) {
    if (typeof value === 'object' && value !== null) {
      if (value.value !== undefined && !!value._schema && _.size(value) === 2) {
        data[key] = value.value;
      } else {
        removeSchemaFromData(value);
      }
    }
  });
  delete data._schema;
  return data;
}

// todo: add validation
function validate(data, schema) {
  return [];
}

/**
 * update data for a component.
 * @param  {string}   ref
 * @param {{}} data  (relative to path)
 * @param {string} [path] part of the schema (for partial updates)
 * @returns {Promise}
 */
function update(ref, data, path) {
  //as soon as we're trying to change data, clear the cache because it'll only tell us what we want to hear: that there
  // have been no changes
  refSchema = {};
  refData = {};

  //remove top-level self-reference
  removeSchemaFromData(data);

  // get the schema and validate data
  return getSchema(ref)
    .then(function (schema) {
      var validationErrors = validate(data, schema);

      if (validationErrors.length) {
        throw new Error(validationErrors);
      } else {
        return getDataOnly(ref).then(function (oldData) {
          // if path is specified, set newData into the proper place
          if (path) {
            data = _.set(oldData, path, data);
          }
          delete data._ref;

          return db.putToReference(ref, data)
            .then(function () {
              // todo: replace component without page reload
              location.reload();
            });
        });
      }
    });
}

// expose main methods
module.exports = {
  getData: getData,
  getDataOnly: getDataOnly,
  getSchema: getSchema,
  validate: validate,
  update: update,
  setSchemaCache: setSchemaCache,
  setDataCache: setDataCache
};