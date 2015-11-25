var _ = require('lodash'),
  urlParse = require('url'),
  dom = require('./../dom'),
  references = require('../references'),
  site = require('./../site'),
  extHtml = '.html',
  componentRoute = '/components/',
  schemaEndpoint = '/schema';

/**
 * True if str is a uri
 * @param {string} str
 * @returns {boolean}
 */
function isUri(str) {
  var strLen = str.length,
    firstSlash = str.indexOf('/'),
    pathStart = firstSlash > -1 ? firstSlash : strLen,
    host = str.substr(0, pathStart),
    doubleSlash = host.indexOf('//'),
    colon = host.indexOf(':');

  return firstSlash !== 0 && doubleSlash === -1 && colon === -1;
}

/**
 * True if str is a url
 * @param {string} str
 * @returns {boolean}
 */
function isUrl(str) {
  var parts = urlParse.parse(str);

  return !!parts.hostname && !!parts.protocol && !!parts.path;
}

/**
 * convert url (with protocol and port) into uri
 * @param {string} url
 * @throws if not a valid url
 * @returns {string}
 */
function urlToUri(url) {
  var parts = urlParse.parse(url);

  if (!isUrl(url)) {
    throw new TypeError('Not a valid url:', url);
  }

  return parts.hostname + parts.pathname;
}

/**
 * Block non-uris
 *
 * @param {*} uri
 * @throws Error if not a string and uri
 */
function assertUri(uri) {
  if (!_.isString(uri) || !isUri(uri)) {
    throw new Error('Expected uri, not ' + uri);
  }
}

/**
 * add port and protocol to uris
 * @param  {string} uri
 * @return {string} uri with port and protocol added, if applicable
 */
function createUrl(uri) {
  return site.addProtocol(site.addPort(uri));
}

/**
 * @param {object} obj
 * @returns {object}
 */
function addJsonHeader(obj) {
  _.assign(obj, {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });

  return obj;
}

/**
 * @param {object} obj
 * @returns {object}
 */
function addTextHeader(obj) {
  _.assign(obj, {
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8'
    }
  });

  return obj;
}

/**
 * @param {object} options
 * @returns {Promise}
 */
function send(options) {
  return new Promise(function (resolve, reject) {
    var request = new XMLHttpRequest();

    if (_.isString(options)) {
      options = {
        method: 'GET',
        url: options
      };
    }

    request.open(options.method, createUrl(options.url), true);

    _.each(options.headers, function (value, key) {
      request.setRequestHeader(key, value);
    });

    if (_.isObject(options.data)) {
      options.data = JSON.stringify(options.data);
    }

    request.send(options.data);
    request.addEventListener('load', function (e) {
      var target = e.currentTarget || e.target;

      if (target.readyState === 4) {
        try {
          resolve(target);
        } catch (err) {
          reject(err);
        }
      }
    }, false);
    request.addEventListener('error', function (e) { reject(e); }, false);
    request.addEventListener('abort', function (e) { reject(e); }, false);
  });
}

/**
 *
 * @param {Element} target
 * @returns {string|Element}
 */
function expectTextResult(target) {
  var statusCodeGroup = target.status.toString()[0];

  if (statusCodeGroup === '2') {
    return target.responseText;
  } else if (statusCodeGroup === '4' || statusCodeGroup === '5') {
    throw new Error(target.status);
  } else {
    return target;
  }
}

/**
 * expect something to exist
 * @param {Element} target
 * @returns {boolean}
 */
function expectBooleanResult(target) {
  var statusCodeGroup = target.status.toString()[0];

  if (statusCodeGroup === '2') {
    return true;
  } else if (statusCodeGroup === '4' || statusCodeGroup === '5') {
    return false; // note: it returns false instead of throwing an error
  } else {
    return true; // 304s and such
  }
}

/**
 * Translate the response into what we expect
 * @param {Element} target
 * @returns {{}|Element}
 */
function expectJSONResult(target) {
  var statusCodeGroup = target.status.toString()[0];

  if (statusCodeGroup === '2') {
    return JSON.parse(target.responseText);
  } else if (statusCodeGroup === '4' || statusCodeGroup === '5') {
    throw new Error(target.status);
  } else {
    return target;
  }
}

/**
 * Translate the response into what we expect
 * @param {string} uri  The returned object probably won't have this because it would be referencing itself, so
 *   we need to remember it and add it.
 * @returns {function}
 */
function expectHTMLResult(uri) {
  return function (target, error) {
    var container, componentEl, statusCodeGroup;

    if (error) {
      throw error;
    } else {
      statusCodeGroup = target.status.toString()[0];
      if (statusCodeGroup === '2') {
        container = document.createElement('div');
        container.innerHTML = target.responseText;
        // The first element in a component always has the referenceAttribute.
        componentEl = dom.getFirstChildElement(container);
        if (!componentEl) {
          throw new Error('Malformed HTML: ' + target.responseText);
        }
        componentEl.setAttribute(references.referenceAttribute, uri);
        return componentEl;
      } else if (statusCodeGroup === '4' || statusCodeGroup === '5') {
        throw new Error(target.status + ': ' + target.statusText);
      } else {
        return target;
      }
    }
  };
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
function getSchema(uri) {
  var prefix, name;

  assertUri(uri);

  // get the prefix for _this specific uri_, regardless of others used on this page.
  prefix = uri.substr(0, uri.indexOf(componentRoute)) + componentRoute;
  name = references.getComponentNameFromReference(uri);

  return send(prefix + name + schemaEndpoint).then(expectJSONResult);
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
function getObject(uri) {
  assertUri(uri);

  return send(uri).then(expectJSONResult);
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
function getText(uri) {
  assertUri(uri);

  return send(uri).then(expectTextResult);
}

/**
 * a quick way to check if a resource exists
 * @param {string} uri
 * @returns {Promise}
 */
function getHead(uri) {
  assertUri(uri);

  return send(uri).then(expectBooleanResult);
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
function getHTML(uri) {
  assertUri(uri);

  return send(uri + extHtml).then(expectHTMLResult(uri));
}

/**
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
function save(uri, data) {
  assertUri(uri);

  return send(addJsonHeader({
    method: 'PUT',
    url: uri,
    data: data
  })).then(expectJSONResult);
}

/**
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
function saveText(uri, data) {
  assertUri(uri);

  return send(addTextHeader({
    method: 'PUT',
    url: uri,
    data: data
  })).then(expectTextResult);
}

/**
 * Create a new object.
 *
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
function create(uri, data) {
  assertUri(uri);

  return send(addJsonHeader({
    method: 'POST',
    url: uri,
    data: data
  })).then(expectJSONResult);
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
function remove(uri) {
  assertUri(uri);

  return send(addJsonHeader({
    method: 'DELETE',
    url: uri
  })).then(expectJSONResult);
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
function removeText(uri) {
  assertUri(uri);

  return send(addTextHeader({
    method: 'DELETE',
    url: uri
  })).then(expectTextResult);
}

module.exports.getSchema = getSchema;
module.exports.get = getObject;
module.exports.getText = getText;
module.exports.getHead = getHead;
module.exports.getHTML = getHTML;
module.exports.save = save;
module.exports.saveText = saveText;
module.exports.create = create;
module.exports.remove = remove;
module.exports.removeText = removeText;
module.exports.isUri = isUri;
module.exports.isUrl = isUrl;
module.exports.urlToUri = urlToUri;
