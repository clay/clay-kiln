var _ = require('lodash'),
  dom = require('./../dom'),
  cache = require('./cache'),
  db = require('./db'),
  references = require('./../references'),
  site = require('./../site'),
  refProp = references.referenceProperty,
  pagesRoute = '/pages/',
  urisRoute = '/uris/',
  bannedFields = [refProp, '_self', '_groups', '_components', '_pageRef', '_pageData', '_version', '_refs',
    'layout', 'template'];

/**
 * Do validation
 *
 * @param {object} data
 * @param {schema} schema
 * @returns {Array}
 */
function validate(data, schema) {
  var errors = [],
    keys = Object.keys(data),
    fields = Object.keys(schema),
    foundBannedFields = _.intersection(bannedFields, keys),
    unknownFields = _.select(keys, function (key) { return !_.contains(fields, key); });

  if (foundBannedFields.length) {
    errors.push(new Error('Banned fields found in data: ' + foundBannedFields.toString()));
  }

  if (unknownFields.length) {
    errors.push(new Error('Unknown fields found in data: ' + unknownFields.toString()));
  }

  return errors;
}

/**
 * update data for a component.
 * @param  {string} uri
 * @param {object} data
 * @returns {Promise}
 */
function save(uri, data) {
  // get the schema and validate data
  return cache.getSchema(uri).then(function (schema) {
    var validationErrors = validate(data, schema);

    if (validationErrors.length) {
      throw new Error(validationErrors);
    } else {
      return cache.saveThrough(uri, data);
    }
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
 * @param {string} uri e.g. localhost.dev.nymag.biz/pages/U7V8okzAAAA=.html
 * @returns {string} e.g. localhost.dev.nymag.biz/pages/U7V8okzAAAA=
 */
function removeExtension(uri) {
  return uri.replace(/\.(html|json)$/i, '');
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
  var uri = dom.uri(),
    isBarePage = uri.indexOf(pagesRoute) > -1,
    pageRefPromise = isBarePage ? Promise.resolve(uri) : getUriDestination();

  return pageRefPromise.then(function (pageReference) {
    var pageUri = pathOnly(pageReference);

    return cache.getDataOnly(pageUri).then(function (data) {
      return save(pageUri + '@published', data);
    });
  });
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
    return cache.createThrough(prefix + pagesRoute, data).then(function (res) {
      location.href = getNewPageUrl(res[refProp]);
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
  return cache.getData(opts.parentRef).then(function (parentData) {
    var index,
      val = {};

    parentData = _.cloneDeep(parentData);
    val[refProp] = opts.ref;
    index = _.findIndex(parentData[opts.parentField], val);
    parentData[opts.parentField].splice(index, 1); // remove component from parent data
    dom.removeElement(opts.el); // remove component from DOM
    return save(opts.parentRef, parentData);
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
  return cache.getData(opts.parentRef).then(function (parentData) {
    var prevIndex,
      prevItem = {},
      item = {};

    parentData = _.cloneDeep(parentData);
    item[refProp] = opts.ref;
    if (opts.prevRef) {
      // Add to specific position in the list.
      prevItem[refProp] = opts.prevRef;
      prevIndex = _.findIndex(parentData[opts.parentField], prevItem);
      parentData[opts.parentField].splice(prevIndex + 1, 0, item);
    } else {
      // Add to end of list.
      parentData[opts.parentField].push(item);
    }
    return save(opts.parentRef, parentData)
      .then(db.getHTML.bind(null, opts.ref));
  });
}

// expose main actions (alphabetical!)
module.exports = {
  addToParentList: addToParentList,
  createComponent: createComponent,
  createPage: createPage,
  getUriDestination: getUriDestination,
  publishPage: publishPage,
  removeFromParentList: removeFromParentList,

  // please stop using these
  getData: cache.getData,
  getDataOnly: cache.getDataOnly,
  getSchema: cache.getSchema,
  save: save
};
