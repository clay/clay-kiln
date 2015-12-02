var _ = require('lodash'),
  dom = require('./../dom'),
  cache = require('./cache'),
  db = require('./db'),
  references = require('../references'),
  site = require('./../site'),
  urlParse = require('url'),
  progress = require('../progress'),
  refProp = references.referenceProperty,
  pagesRoute = '/pages/',
  urisRoute = '/uris/',
  scheduleRoute = '/schedule',
  schemaKeywords = ['_ref', '_groups'],
  knownExtraFields = ['_ref', '_schema'],
  bannedFields = ['_self', '_components', '_pageRef', '_pageData', '_version', '_refs', 'layout', 'template'];

/**
 * Cloning removes extra properties like _schema from standard types like Array, because we're doing a bad thing.
 *
 * This function adds them back.
 *
 * @param {object} data
 * @returns {object}
 */
function addDeviantArraySchemas(data) {
  _.each(data._schema, function (fieldDefinition, fieldName) {
    var value = data[fieldName];

    if (_.isArray(value)) {
      value._schema = fieldDefinition;
    }
  });
  return data;
}

/**
 * Do validation
 *
 * @param {object} data
 * @param {schema} schema
 * @returns {Array}
 */
function validate(data, schema) {
  var errors = [],
    uri = data[refProp],
    keys = Object.keys(data),
    groupFields = schema._groups && Object.keys(schema._groups) || [],
    fields = Object.keys(schema).concat(knownExtraFields).concat(groupFields),
    foundBannedFields = _.intersection(bannedFields, keys),
    unknownFields = _.select(keys, function (key) { return !_.contains(fields, key); });

  if (!uri) {
    errors.push(new Error('Cannot save data without ' + refProp));
  }

  if (foundBannedFields.length) {
    errors.push(new Error('Banned fields found in data: ' + foundBannedFields.toString()));
  }

  if (unknownFields.length) {
    // todo: we need to decide:

    // be forgiving; they meant well
    _.each(unknownFields, function (unknownField) {
      delete data[unknownField];
    });

    // unforgiving: errors.push(new Error('Unknown fields found in data: ' + unknownFields.toString()));
  }

  // block unusual formatting of data (so the errors_for saving past this point are consistent)
  _.each(fields, function (fieldName) {
    var str,
      value = data[fieldName];

    // everything that is not a schemaKeyword must be object-like (object, array, etc.)
    if (!_.contains(schemaKeywords, fieldName) && typeof value !== 'object') {
      str = 'Amphora-style data (raw value) found in ' + fieldName + '; please use ClayKiln style (value, _schema) instead.';
      errors.push(new Error(str));
    }
  });

  return errors;
}

/**
 * Update data for a component.
 *
 * Note: try to operate on full objects with schemas so we don't have to lookup the schema for validation.
 *
 * @param {object} data  data that will be saved
 * @param {string} data._ref  uri to save
 * @param {object} [data._schema]  schema to validate against (optional; we can look this up)
 * @returns {Promise}
 */
function save(data) {
  var uri = data[refProp],
    schemaPromise = data._schema && Promise.resolve(data._schema) || cache.getSchema(uri);

  progress.start('save');
  // get the schema and validate data
  return schemaPromise.then(function (schema) {
    var validationErrors = validate(data, schema);

    if (validationErrors.length) {
      throw new Error(validationErrors);
    } else {
      return cache.saveThrough(data)
        .then(function (savedData) {
          progress.done();
          return savedData;
        })
        .catch(function () {
          progress.done('error');
          progress.open('error', `A server error occured. Please try again.`, true);
        });
    }
  });
}

/**
 * Update data for a part of a component.
 * @param {object} data
 * @param {string} data._ref  uri to save
 * @returns {Promise}
 */
function savePartial(data) {
  var uri = data[refProp];

  // get the old version of the data, and fill in all the missing information
  return cache.getData(uri).then(function (oldData) {
    return save(_.defaults(data, oldData));
  });
}

/**
 * Get page reference from current location
 * @param {string} [location]
 * @returns {Promise}
 */
function getUriDestination(location) {
  var prefix;

  if (_.isString(location)) {
    return db.getText(location).then(function (result) {
      if (_.contains(result, urisRoute)) {
        result = getUriDestination(result);
      }

      return result;
    });
  } else {
    prefix = site.get('prefix');
    return getUriDestination(prefix + urisRoute + btoa(dom.uri()));
  }
}

/**
 * Remove a uri.
 *
 * @param {string} uri
 * @returns {Promise}
 * @example edit.removeUri('nymag.com/press')
 */
function removeUri(uri) {
  var prefix, base64Uri, targetUri;

  // assertion
  if (!_.isString(uri) || !db.isUri(uri)) {
    throw new TypeError('Expecting uri, not ' + uri);
  }

  prefix = site.get('prefix');
  base64Uri = btoa(uri);
  targetUri = prefix + urisRoute + base64Uri;

  return db.removeText(targetUri);
}

/**
 * Get the component from the page that is the "canonical component" in charge of providing a canonicalUrl for the page.
 *
 * @returns {string}
 */
function getFirstCanonicalComponentReference() {
  var cacheMap = _.get(cache, 'getSchema.cache.__data__');

  return cacheMap && _.findKey(cacheMap, 'canonicalUrl');
}

/**
 * Publish current page's saved data.
 *
 * Pages don't have schemas or validation (later?), so save directly to db.
 *
 * @returns {Promise.string}
 */
function publishPage() {
  var pageUri = document.firstElementChild.getAttribute(references.referenceAttribute);

  return cache.getDataOnly(pageUri).then(function (pageData) {
    // pages don't have schemas or validation
    return db.save(pageUri + '@published', _.omit(pageData, '_ref'));
  }).then(function (publishedPageData) {
    // note: when putting to page@published, amphora will add the uri to /uris/
    return publishedPageData.url;
  });
}

/**
 * unpublishes current page. returns the deleted page data
 * @returns {Promise}
 */
function unpublishPage() {
  var ref = getFirstCanonicalComponentReference();

  if (ref) {
    // get published version of component, and expose the page
    return cache.getDataOnly(ref + '@published').then(function (data) {
      var uri;

      if (_.isString(data.canonicalUrl)) {
        uri = db.urlToUri(data.canonicalUrl); // change url into a uri
        return removeUri(uri);
      }
    });
  }
}

/**
 * Get a url for the new page that was just created, including protocol and port
 *
 * @param {string} uri
 * @returns {string}
 */
function getNewPageUrl(uri) {
  return site.addProtocol(site.addPort(uri + '.html?edit=true'));
}

/**
 * create a new page, cloning the current page
 * @returns {Promise}
 */
function createPage() {
  var prefix = site.get('prefix'),
    newPageUri = prefix + pagesRoute + 'new';

  return cache.getDataOnly(newPageUri).then(function (data) {
    return db.create(prefix + pagesRoute, _.omit(data, '_ref')).then(function (res) {
      return getNewPageUrl(res[refProp]);
    });
  });
}

/**
 * Create a new component.
 *
 * Assumes creation is happening at current site prefix.
 *
 * @param {string} name     The name of the component.
 * @param {object} [data]   Data to save.
 * @returns {Promise}
 */
function createComponent(name, data) {
  var base = site.get('prefix') + '/components/' + name,
    instance = base + '/instances';

  if (data) {
    return cache.createThrough(instance, data);
  } else {
    return cache.getDataOnly(base) // create component with base JSON from bootstrap.
      .then(function (baseJson) {
        return cache.createThrough(instance, baseJson);
      });
  }
}

/**
 * Remove a component from a list.
 * @param {object}  opts
 * @param {Element} opts.el          The component to be removed.
 * @param {string}  opts.ref         The ref of the component to be removed.
 * @param {string}  opts.parentField
 * @param {string}  opts.parentRef
 * @returns {Promise}
 */
function removeFromParentList(opts) {
  var el = opts.el,
    ref = opts.ref,
    parentRef = opts.parentRef,
    parentField = opts.parentField;

  return cache.getData(parentRef).then(function (parentData) {
    var index,
      item = {};

    parentData = _.cloneDeep(parentData);
    item[refProp] = ref;
    index = _.findIndex(parentData[parentField], item);
    parentData[parentField].splice(index, 1); // remove component from parent data
    dom.removeElement(el); // remove component from DOM
    return save(parentData);
  });
}

/**
 * Add a component to the parent list data. If prevRef is not provided, adds to the end of the list.
 * @param {object} opts
 * @param {string} opts.ref
 * @param {string} [opts.prevRef]     The ref of the item to insert after.
 * @param {string} opts.parentField
 * @param {string} opts.parentRef
 * @returns {Promise} Promise resolves to new component Element.
 */
function addToParentList(opts) {
  var ref = opts.ref,
    prevRef = opts.prevRef,
    parentField = opts.parentField,
    parentRef = opts.parentRef;

  return cache.getData(parentRef).then(function (parentData) {
    var prevIndex,
      prevItem = {},
      item = {};

    parentData = _.cloneDeep(parentData);
    item[refProp] = ref;
    if (prevRef) {
      // Add to specific position in the list.
      prevItem[refProp] = prevRef;
      prevIndex = _.findIndex(parentData[parentField], prevItem);
      parentData[parentField].splice(prevIndex + 1, 0, item);
    } else {
      // Add to end of list.
      parentData[parentField].push(item);
    }

    return save(parentData)
      .then(db.getHTML.bind(null, ref));
  });
}

/**
 * schedule publish
 * @param {object} data
 * @param {number} data.at unix timestamp to be published at
 * @param {string} data.publish uri to be published
 * @returns {Promise}
 */
function schedulePublish(data) {
  var prefix = site.get('prefix');

  return db.create(prefix + scheduleRoute, data);
}

/**
 * unschedule publish
 * @param {string} uri
 * @returns {Promise}
 */
function unschedulePublish(uri) {
  var prefix = site.get('prefix');

  // search through scheduled entries until you find the one we want
  // todo: when amphora is updated so the _ref points to the schedule entry (rather than the page),
  // just do GET page@scheduled and then DELETE /schedule/<_ref>
  return db.get(prefix + scheduleRoute).then(function (data) {
    var entry = _.find(data, function (item) {
      return item.publish === uri;
      // note: we only allow a page to be scheduled once, so we don't need to
      // also match for timestamp (this saves us a call to GET uri@scheduled)
    });

    if (entry) {
      return db.remove(entry._ref);
    }
  });
}

/**
 * The sad state is that people think they can write to anything in JavaScript without consequence.  For those people,
 * these functions exist.
 *
 * No caching in the world will save them.
 *
 * @param {string} uri
 * @returns {object}
 */
function getData(uri) {
  return cache.getData(uri).then(_.cloneDeep).then(addDeviantArraySchemas);
}

/**
 * The sad state is that people think they can write to anything in JavaScript without consequence.  For those people,
 * these functions exist.
 *
 * No caching in the world will save them.
 *
 * @param {string} uri
 * @returns {object}
 */
function getDataOnly(uri) {
  return cache.getDataOnly(uri).then(_.cloneDeep).then(addDeviantArraySchemas);
}

// Expose main actions (alphabetical!)
module.exports = {
  // Please use these.  They should be discrete actions that should be well tested.
  addToParentList: addToParentList,
  createComponent: createComponent,
  createPage: createPage,
  createUri: createUri,
  getUriDestination: getUriDestination,
  publishPage: publishPage,
  unpublishPage: unpublishPage,
  removeFromParentList: removeFromParentList,
  removeUri: removeUri,
  savePartial: savePartial,
  save: save,
  schedulePublish: schedulePublish,
  unschedulePublish: unschedulePublish,

  // Please stop using these.  If you use these, we don't trust you.  Do you trust yourself?
  getData: getData,
  getDataOnly: getDataOnly,
  getSchema: cache.getSchema // No one should _ever_ be editing this, so pass them the read-only.  Kill them dead.
};
