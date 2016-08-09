var _ = require('lodash'),
  urlParse = require('url'),
  dom = require('@nymag/dom'),
  references = require('../references'),
  site = require('./../site'),
  rest = require('./rest'), // todo: use native fetch when safari supports it
  extHtml = '.html',
  editMode = '?edit=true',
  // when we ask for updated component html,
  // make sure the server knows we're in edit mode
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
function uriToUrl(uri) {
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
 * check status of a request, passing through data on 2xx and 3xx
 * and erroring on 4xx and 5xx
 * @param {object} res
 * @returns {object}
 * @throws error on non-200/300 response status
 */
function checkStatus(res) {
  if (res.status >= 200 && res.status < 400) {
    return res;
  } else {
    let error = new Error(res.statusText);

    error.response = res;
    throw error;
  }
}

/**
 * @param {string|object} options
 * @returns {Promise}
 */
function send(options) {
  if (_.isString(options)) {
    options = {
      method: 'GET',
      url: options
    };
  }

  // add credentials. this tells fetch to pass along cookies, incl. auth
  options.credentials = 'same-origin';

  return rest.send(uriToUrl(options.url), options).then(checkStatus);
}

/**
 * @param {object} res
 * @returns {string}
 */
function expectTextResult(res) {
  return res.text();
}

/**
 * expect something to exist
 * note: make sure you call this in the .then() AND .catch() of a promise
 * @param {object} res
 * @returns {boolean}
 */
function expectBooleanResult(res) {
  if (_.isError(res)) {
    return false;
  } else {
    return true;
  }
}

/**
 * @param {object} res
 * @returns {object}
 */
function expectJSONResult(res) {
  return res.json();
}

/**
 * @param {string} uri  The returned object probably won't have this because it would be referencing itself, so
 *   we need to remember it and add it.
 * @returns {function}
 */
function expectHTMLResult(uri) {
  return function (res) {
    return res.text().then(function (body) {
      // string -> elements
      return dom.create(body);
    })
    .then(function (html) {
      // add uri
      html.setAttribute(references.referenceAttribute, uri);
      return html;
    });
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

  return send(uri).then(expectBooleanResult).catch(expectBooleanResult);
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
function getHTML(uri) {
  assertUri(uri);

  return send(uri + extHtml + editMode).then(expectHTMLResult(uri));
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
    body: JSON.stringify(data)
  })).then(expectJSONResult);
}

/**
 * save, expecting html to be returned from the server
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
function saveForHTML(uri, data) {
  assertUri(uri);

  return send(addJsonHeader({
    method: 'PUT',
    url: uri + extHtml + editMode,
    body: JSON.stringify(data)
  })).then(expectHTMLResult(uri));
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
    body: data
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
    body: JSON.stringify(data)
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
module.exports.saveForHTML = saveForHTML;
module.exports.saveText = saveText;
module.exports.create = create;
module.exports.remove = remove;
module.exports.removeText = removeText;
module.exports.isUri = isUri;
module.exports.isUrl = isUrl;
module.exports.urlToUri = urlToUri;
module.exports.uriToUrl = uriToUrl;
