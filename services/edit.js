var _ = require('lodash'),
  dom = require('./dom'),
  db = require('./db'),
  references = require('./references'),
  // store the component data in memory
  refData = {},
  // store the component schemas in memory
  refSchema = {},
  keywords = ['_groups'];

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
 * True if value has a property called fields.
 * @param {*} value
 * @returns {boolean}
 */
function hasFields(value) {
  return value && !!value.fields;
}

/**
 * get data for a component. cached on the client side
 * @param  {string}   ref
 * @returns {Promise}
 */
function getDataOnly(ref) {
  if (refData[ref]) {
    // clone because other people are modifying data, and we don't want to change the cache.
    return Promise.resolve(_.cloneDeep(refData[ref]));
  } else {
    return db.getComponentJSONFromReference(ref)
      .then(function (data) {
        // be nice, remember where this data is from
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
  _.each(schema, function (schemaPart, key) {
    var propertyExists = _.has(data, key),
      value = data[key];

    if (_.isObject(schemaPart) && !_.contains(keywords, key)) {
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
 * Add _name property to each field definition on the first-level of a schema.
 *
 * Note: In-place edit of schema object
 *
 * @param {object} schema
 */
function addNameToFieldsOfSchema(schema) {
  _.each(schema, function (definition, name) {
    if (!_.contains(keywords, name) && _.isObject(definition)) {
      definition._name = name;
    }
  });
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

function getData(ref) {
  return Promise.all([getSchema(ref), getDataOnly(ref)]).then(function (res) {
    var schema = res[0],
      data = addSchemaToData(schema, res[1]);

    addNameToFieldsOfSchema(schema);
    data = addGroupFieldsToData(data, schema);
    return data;
  });
}

/**
 * @param {object} data
 * @returns {object}
 */
function removeSchemaFromData(data) {
  if (!!data && data.value !== undefined && !!data._schema && _.size(data) === 2) {
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

// todo: add validation
function validate() {
  return [];
}

/**
 * update data for a component.
 * @param  {string}   ref
 * @param {object} data
 * @returns {Promise}
 */
function update(ref, data) {
  // as soon as we're trying to change data, clear the cache because it'll only tell us what we want to hear: that there
  // have been no changes
  refSchema = {};
  refData = {};

  // remove top-level self-reference
  data = removeSchemaFromData(data);

  // get the schema and validate data
  return getSchema(ref)
    .then(function (schema) {
      var validationErrors;

      data = removeGroupFieldsFromData(data, schema);

      validationErrors = validate(data, schema);

      if (validationErrors.length) {
        throw new Error(validationErrors);
      } else {
        return getDataOnly(ref).then(function (oldData) {
          // shallowly copy over the new data
          data = _.defaults(data, oldData);
          delete data._ref;
          // Clear cache for this ref.
          delete refData[ref];
          return db.putToReference(ref, data);
        });
      }
    });
}

/**
 * Get page reference from current location
 * @param {string} [location]
 * @returns {Promise.string}
 */
function getUriDestination(location) {
  if (_.isString(location)) {
    return db.getTextFromReference(location).then(function (result) {
      if (result.match(/^\/uris\//)) {
        getUriDestination(result);
      } else {
        return result;
      }
    });
  } else {
    return getUriDestination('/uris/' + btoa(dom.uri()));
  }
}

/**
 * @param {string} uri
 * @returns {string}
 */
function removeExtension(uri) {
  return uri.split('.')[0];
}

/**
 * @param {string} uri
 * @returns {string}
 */
function removeVersion(uri) {
  return uri.split('@')[0];
}

/**
 * @param {string} uri
 * @returns {string}
 */
function pathOnly(uri) {
  return removeVersion(removeExtension(uri));
}

/**
 * Publish current page's saved data.
 * @returns {Promise.string}
 */
function publishPage() {
  return getUriDestination().then(function (pageReference) {
    var path = pathOnly(pageReference);

    return getDataOnly(path).then(function (data) {
      delete data._ref;
      return db.putToReference(path + '@published', data);
    });
  });
}

/**
 * create a new page, cloning the current page
 * @returns {Promise}
 */
function createPage() {
  var path = '/pages/new';

  return getDataOnly(path).then(function (data) {
    delete data._ref;
    return db.postToReference('/pages', data).then(function (res) {
      location.href = res[references.referenceProperty] + '.html?edit=true';
    }).catch(console.error);
  });
}

/**
 * Remove a component from a list.
 * @param {Element} el          The component to be removed.
 * @param {string} ref          The ref of the component to be removed.
 * @param {string} parentField
 * @param {string} parentRef
 * @returns {Promise}
 */
function removeFromParentList(el, ref, parentField, parentRef) {
  return db.getComponentJSONFromReference(parentRef).then(function (parentData) {
    var index,
      val = {};

    val[references.referenceProperty] = ref;
    index = _.findIndex(parentData[parentField], val);
    parentData[parentField].splice(index, 1); // remove component from parent data
    dom.removeElement(el); // remove component from DOM
    return db.putToReference(parent.ref, parentData);
  });
}

// expose main methods (alphabetical)
module.exports = {
  addSchemaToData: addSchemaToData,
  addGroupFieldsToData: addGroupFieldsToData,
  getData: getData,
  getDataOnly: getDataOnly,
  getSchema: getSchema,
  getUriDestination: getUriDestination,
  removeSchemaFromData: removeSchemaFromData,
  removeGroupFieldsFromData: removeGroupFieldsFromData,
  publishPage: publishPage,
  createPage: createPage,
  setSchemaCache: setSchemaCache,
  setDataCache: setDataCache,
  update: update,
  validate: validate,
  removeFromParentList: removeFromParentList
};
