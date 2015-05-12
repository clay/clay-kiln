'use strict';
var _ = require('lodash'),
  db = require('./db'),
  // store the component data in memory
  componentData = {},
  // store the component schemas in memory
  componentSchemas = {};
  // todo: figure out multi-user edit, since this won't pull in changes correctly if
  // multiple people are changing data in a component without page reloads

_.mixin(require('lodash-deep'));

/**
 * get data for a component. cached on the client side
 * @param  {string}   ref
 * @returns {Promise}
 */
function getData(ref) {
  if (componentData[ref]) {
    return Promise.resolve(componentData[ref]);
  } else {
    return db.getComponentJSONFromReference(ref)
      .then(function (data) {
        componentData[ref] = data;
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
  if (componentSchemas[ref]) {
    return Promise.resolve(componentSchemas[ref]);
  } else {
    return db.getSchemaFromReference(ref)
      .then(function (schema) {
        componentSchemas[ref] = schema;
        return schema;
      });
  }
}

/**
 * convenience function to get schema + data
 * @param  {string} ref  
 * @param  {string} [path] path to a subset of the schema/data, e.g. title.long
 * @return {Promise}      { schema: obj, data: obj }
 */
function getSchemaAndData(ref, path) {
  return Promise.all([getSchema(ref), getData(ref)]).then(function (res) {
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
  // if path is specified, deepSet newData into the proper place
  if (path && !_.contains(Object.keys(newData), path)) {
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
        return getData(ref)
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
  getSchema: getSchema,
  getSchemaAndData: getSchemaAndData,
  validate: validate,
  update: update
};