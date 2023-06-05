import _ from 'lodash';
import { create as createDom } from '@nymag/dom';
import { assertUri, uriToUrl, assertUrl } from '../utils/urls';
import store from './store';
import rest from '../utils/rest';
import {
  getComponentName,
  contentHeader,
  contentJSON,
  userHeader,
  contentText,
  refAttr,
  componentRoute,
  schemaRoute,
  listsRoute,
  hooksExt,
  htmlExt,
  editComponentExt,
  layoutAttr,
  loginRoute
} from '../utils/references';

// note: all api calls should be going through the queue, so they can handle
// the user dropping offline or having issues with their connection,
// as well as to guarantee the order of operations sent to the server

/**
 * @param {object} obj
 * @returns {object}
 */
function addJsonHeader(obj) {
  _.assign(obj, {
    headers: {
      [contentHeader]: contentJSON,
      [userHeader]: _.get(store, 'state.user.username')
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
      [contentHeader]: contentText,
      [userHeader]: _.get(store, 'state.user.username')
    }
  });

  return obj;
}

/**
 * add headers to all GET requests
 * @param {string} url
 * @returns {object}
 */
function addGetHeader(url) {
  return {
    method: 'GET',
    url: url,
    headers: {
      [userHeader]: _.get(store, 'state.user.username')
    }
  };
}

/**
 * add component hooks flag
 * @param {string} uri
 * @param {Boolean} hooks
 * @returns {string}
 */
function addHooks(uri, hooks) {
  // set `false` to disable component models from firing their save/render hooks
  // note: this is true by default
  return hooks === false ? uri + hooksExt : uri;
}

/**
 * handle errors thrown by fetch itself, e.g. connection refused
 * @param  {string} method
 * @return {object}        with `statusText` for checkStatus to handle
 */
function checkError(method) {
  return function apiError() {
    return { statusText: `Cannot ${method === 'GET' ? 'get' : 'send'} data` };
  };
}

/**
 * check status of a request, passing through data on 2xx and 3xx
 * and erroring on 4xx and 5xx
 * @param {string} url
 * @returns {object}
 * @throws error on non-200/300 response status
 */
function checkStatus(url) {
  return function (res) {
    /* istanbul ignore else */
    if (res.status && res.status >= 200 && res.status < 400) {
      return res;
    } else if (url !== res.url && _.includes(res.url, loginRoute)) {
      // login redirect!
      // this means we're trying to do an api call but we're not authenticated.
      // reload the page to force a redirect to the login page
      // (while also preserving the current page to redirect back to once they log in)
      window.location.reload();
    } else {
      let error = new Error(res.statusText);

      error.response = res;
      throw error;
    }
  };
}

/**
 * send api call!
 * @param {string|object} options
 * @returns {Promise}
 */
function send(options) {
  let url = uriToUrl(options.url);

  // add credentials. this tells fetch to pass along cookies, incl. auth
  options.credentials = 'same-origin';

  return rest.send(url, options)
    .catch(checkError(options.method))
    .then(checkStatus(url));
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
 * @param {string} uri  The returned object probably won't have this because it would be referencing itself, so we need to remember it and add it.
 * @returns {function}
 */
function expectHTMLResult(uri) {
  return res => res.text().then((str) => {
    // if we get a full document, return it as a full document.
    // otherwise pass whatever we get into dom.create()
    if (_.includes(str, '<html')) { // note: html tag might contain attributes
      // what's up, doc?
      const parser = new DOMParser();

      return parser.parseFromString(str, 'text/html');
    } else {
      return createDom(str);
    }
  }).then((html) => {
    if (html.nodeType === html.ELEMENT_NODE) {
      // it's an element, add the uri
      html.setAttribute(refAttr, uri);
    } else if (html.nodeType === html.DOCUMENT_FRAGMENT_NODE) {
      // it's a document fragment, add the uri to the first child
      html.firstElementChild.setAttribute(refAttr, uri);
    } else if (html.nodeType === html.DOCUMENT_NODE) {
      const pageUri = _.get(store, 'state.page.uri');

      html.documentElement.setAttribute(layoutAttr, uri);
      html.documentElement.setAttribute(refAttr, pageUri);
    }

    return html;
  });
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
export function getSchema(uri) {
  // get the prefix for _this specific uri_, regardless of others used on this page.
  const prefix = uri.substr(0, uri.indexOf(componentRoute)) + componentRoute,
    name = getComponentName(uri);

  assertUri(uri);

  return send(addGetHeader(prefix + name + schemaRoute)).then(expectJSONResult);
}

/**
 * get data from the api
 * @param {string} uri
 * @returns {Promise}
 */
export function getObject(uri) {
  assertUri(uri);

  return send(addGetHeader(uri)).then(expectJSONResult);
}

/**
 * get data from an external url
 * @param {string} reqUrl
 * @returns {Promise}
 */
export function getJSON(reqUrl) {
  assertUrl(reqUrl);

  return send(addGetHeader(reqUrl)).then(expectJSONResult);
}

/**
 * @param {string} uri
 * @returns {Promise}
 */
export function getText(uri) {
  assertUri(uri);

  return send(addGetHeader(uri)).then(expectTextResult);
}

/**
 * a quick way to check if a resource exists
 * @param {string} uri
 * @returns {Promise}
 */
export function getHead(uri) {
  assertUri(uri);

  return send(addGetHeader(uri)).then(expectBooleanResult).catch(expectBooleanResult);
}

/**
 * note: queries should start with '&'
 * @param {string} uri
 * @param {string} [queries] used by clay-space
 * @returns {Promise}
 */
export function getHTML(uri, queries = '') {
  assertUri(uri);

  /* todo: Currently the second argument is ONLY used for the Space component because
   * querying for article tags is limited. There is a pending update
   * to our elastic indices that should make this unecessary. At that
   * point the 'queries' argument should be removed.
   */

  return send(addGetHeader(uri + htmlExt + editComponentExt + queries)).then(expectHTMLResult(uri));
}

/**
 * @param {string} uri
 * @param {object} data
 * @param {boolean} [hooks] optional, true by default
 * @returns {Promise}
 */
export function save(uri, data, hooks) {
  assertUri(uri);

  uri = addHooks(uri, hooks);

  return send(addJsonHeader({
    method: 'PUT',
    url: uri,
    body: JSON.stringify(data)
  })).then(expectJSONResult);
}

/**
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
export function saveText(uri, data) {
  assertUri(uri);

  return send(addTextHeader({
    method: 'PUT',
    url: uri,
    body: data
  })).then(expectTextResult);
}

/**
 * @param {string} uri
 * @param {object} data
 * @param {boolean} hooks
 * @returns {Promise}
 */
export function create(uri, data, hooks) {
  assertUri(uri);

  uri = addHooks(uri, hooks);

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
export function remove(uri) {
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
export function removeText(uri) {
  assertUri(uri);

  return send(addTextHeader({
    method: 'DELETE',
    url: uri
  })).then(expectTextResult);
}

/**
 * @param {string} uri
 * @param {object} data
 * @returns {Promise}
 */
export function postJSON(uri, data) {
  assertUri(uri);

  return send(addJsonHeader({
    method: 'POST',
    url: uri,
    body: JSON.stringify(data)
  })).then(expectJSONResult);
}

/**
 * convenience function to get list data
 * @param  {string} prefix
 * @param  {string} listName
 * @return {Promise}
 */
export function getList(prefix, listName) {
  let uri = `${prefix}${listsRoute}${listName}`;

  assertUri(uri);

  return send(addGetHeader(uri)).then(expectJSONResult);
}

/**
 * convenience function to save list data
 * @param  {string} prefix
 * @param  {string} listName
 * @param {array} items
 * @return {Promise}
 */
export function saveList(prefix, listName, items) {
  let uri = `${prefix}${listsRoute}${listName}`;

  assertUri(uri);

  return send(addJsonHeader({
    method: 'PUT',
    url: uri,
    body: JSON.stringify(items)
  })).then(expectJSONResult);
}

/**
 * convenience function to save list data
 * @param  {string} prefix
 * @param  {string} listName
 * @param {array} items
 * @return {Promise}
 */
export function patchList(prefix, listName, patch) {
  let uri = `${prefix}${listsRoute}${listName}`;

  assertUri(uri);

  return send(addJsonHeader({
    method: 'PATCH',
    url: uri,
    body: JSON.stringify(patch)
  })).then(expectJSONResult);
}

export function getMeta(uri) {
  assertUri(uri);

  return send(addGetHeader(uri + '/meta')).then(expectJSONResult);
}

export function getPrepublishUrl(uri, date) {
  assertUri(uri);

  const rawDate = new Date(date);
  const scheduledDate = rawDate.toISOString();
  const requestUrl = `https://ss-publish-url-preview-2.dev.vulture.com/get-scheduled-url/?uri=${uri}&evergreen=false&scheduledDate=${scheduledDate}`;

  return send(addGetHeader(requestUrl)).then(expectJSONResult);
}

export function saveMeta(uri, data) {
  assertUri(uri);

  return send(addJsonHeader({
    method: 'PATCH',
    url: uri + '/meta',
    body: JSON.stringify(data)
  })).then(expectJSONResult);
}
