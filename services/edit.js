'use strict';
var _ = require('lodash'),
  db = require('./db'),
  // store the component data in memory
  refData = {},
  // store the component schemas in memory
  refSchema = {};
  // todo: figure out multi-user edit, since this won't pull in changes correctly if
  // multiple people are changing data in a component without page reloads

_.mixin(require('lodash-deep'));

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
    return Promise.resolve(refData[ref]);
  } else {
    return db.getComponentJSONFromReference(ref)
      .then(function (data) {
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
  console.log('getSchema', ref);
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

function mapSchemaToData(schema, data) {
  _.each(data, function (value, key, list) {
    var schemaPart = schema[key];
    if (_.isObject(schemaPart)) {
      if (!_.isObject(value)) {
        list[key] = {
          _schema: schemaPart,
          value: value
        };
      } else {
        mapSchemaToData(schemaPart, value);
      }
    }
  });
  data._schema = schema;
  return data;
}

function getData(ref) {
  return Promise.all([getSchema(ref), getDataOnly(ref)]).then(function (res) {
    return mapSchemaToData(res[0], res[1]);
  });
}

/**
 * convenience function to get schema + data
 * @param  {string} ref  
 * @param  {string} [path] path to a subset of the schema/data, e.g. title.long
 * @return {Promise}      { schema: obj, data: obj }
 */
function getSchemaAndData(ref, path) {
  return Promise.all([getSchema(ref), getDataOnly(ref)]).then(function (res) {
    var schema = res[0],
      data = res[1];

    return {
      schema: path ? _.deepGet(schema, path) : schema,
      data: path ? _.deepGet(data, path) : data
    };
  });
}

// todo: add validation
function validate(data, schema) {
  return [];
}

/**
 * update data for a component.
 * @param  {string}   ref
 * @param {{}} newData
 * @param {string} [path] part of the schema (for partial updates)
 * @returns {Promise}
 */
function update(ref, newData, path) {
  // if path is specified (and it's not the root-level of the component), deepSet newData into the proper place
  if (path && !_.contains(Object.keys(newData), path) && !_.contains(ref, path)) {
    newData = _.deepSet({}, path, newData);
  }

  // get the schema and validate data
  return getSchema(ref)
    .then(function (schema) {
      var validationErrors = validate(newData, schema);

      if (validationErrors.length) {
        throw new Error(validationErrors);
      } else {
        // then get the old data and merge it
        return getDataOnly(ref)
          .then(function (oldData) {
            var data;

            data = _(oldData)
              .assign(newData)
              .omit('_ref')
              .value();

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
  getSchemaAndData: getSchemaAndData,
  validate: validate,
  update: update,
  setSchemaCache: setSchemaCache,
  setDataCache: setDataCache
};