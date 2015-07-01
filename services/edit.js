var _ = require('lodash'),
  dom = require('./dom'),
  db = require('./db'),
  references = require('./references'),
  // store the component data in memory
  refData = {},
  // store the component schemas in memory
  refSchema = {},
  // local key-value store to sync with server (like refData, key is ref, value is component data)
  localStore = {};

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
 * Set to localStore which syncs to the server.
 * @param {string} ref
 * @param {object} data
 */
function setLocalStore(ref, data) {
  localStore[ref] = data;
}

/**
 *
 * @param {string} ref
 */
function unsetLocalStore(ref) {
  delete localStore[ref];
}

/**
 *
 * @param {String} ref
 * @returns {Object}
 */
function getLocalStore(ref) {
  return localStore[ref];
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
 * @param {{}} data  (relative to path)
 * @param {string} [path] part of the schema (for partial updates)
 * @returns {Promise}
 */
function update(ref, data, path) {
  // as soon as we're trying to change data, clear the cache because it'll only tell us what we want to hear: that there
  // have been no changes
  refSchema = {};
  refData = {};

  // remove top-level self-reference
  data = removeSchemaFromData(data);

  // get the schema and validate data
  return getSchema(ref)
    .then(function (schema) {
      var validationErrors = validate(data, schema);

      if (validationErrors.length) {
        throw new Error(validationErrors);
      } else {
        return getDataOnly(ref).then(function (oldData) {
          // if path is specified, set newData into the proper place
          if (path !== references.getComponentNameFromReference(ref)) {
            data = _.set(oldData, path, data);
          } else {
            // otherwise, shallowly copy over the new data
            data = _.defaults(data, oldData);
          }
          delete data._ref;

          setLocalStore(ref, data);
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
 * Called by Object.observe to sync all changes with the server.
 * @param {Array} changes     Array of objects as described below.
 * Each item in the array is an object, e.g.:
 * {String} changes[0].type       The type of change (add, update, or delete).
 * {String} changes[0].name       The key of the value that changes (the ref).
 * {Object} changes[0].object     The object being observed.
 * {String} [changes[0].oldValue] The previous value of the key-value that changed.
 */
function syncChanges(changes) {

  changes.forEach(function (change) {

    var ref = change.name,
      data = change.object[ref],
      type = change.type,
      oldData = change.oldValue;

    switch (type) {
      case 'add':
      case 'update':
        if (data !== oldData) { // `update` event fires even if the data is the same.
          db.putToReference(ref, data)
            .then(function () {

              // Todo: re-render the view.
              window.location.reload();

            });
        }
        break;
      case 'delete': // Todo: remove the reference from the parent?
      default:
        break;
    }

  });
}

/**
 * Start observing the object to sync.
 */
function startSync() {
  localStore = Object.keys(localStore).length > 0 ? localStore : _.cloneDeep(refData);
  // Polyfill for FF.
  if (!Object.observe) {
    require('object.observe');
  }
  Object.observe(localStore, syncChanges);
}

// expose main methods
module.exports = {
  getData: getData,
  getDataOnly: getDataOnly,
  getSchema: getSchema,
  validate: validate,
  update: update,
  setSchemaCache: setSchemaCache,
  setDataCache: setDataCache,
  addSchemaToData: addSchemaToData,
  removeSchemaFromData: removeSchemaFromData,
  getUriDestination: getUriDestination,
  publishPage: publishPage,
  startSync: _.once(startSync),
  setLocalStore: setLocalStore,
  unsetLocalStore: unsetLocalStore,
  getLocalStore: getLocalStore, // exposed for unit tests only
  syncChanges: syncChanges // exposed for unit tests only
};
