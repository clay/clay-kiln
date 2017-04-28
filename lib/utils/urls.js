import { parse } from 'url';

/**
 * add port to uri if it needs it
 * @param {string} uri
 * @param {object} [location] to stub for testing
 * @returns {string}
 */
export function addPort(uri, location) {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;
  const hasPort = location.port === '80' || uri.indexOf(':' + location.port) !== -1;

  return hasPort ? uri : uri.replace(location.hostname, `${location.hostname}:${location.port}`);
}

/**
 * add protocol to uri if it needs it
 * @param {string} uri
 * @param {object} [location] to stub for testing
 * @returns {string}
 */
export function addProtocol(uri, location) {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;
  const hasProtocol = uri.indexOf(location.protocol) === 0;

  return hasProtocol ? uri : `${location.protocol}//${uri}`;
}

/**
 * convenience function to add port and protocol to uris
 * @param {string} uri
 * @param {object} [location] to stub for testing (or to generate url for a different site)
 * @returns {string}
 */
export function uriToUrl(uri, location) {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;
  return addProtocol(addPort(uri, location), location);
}

/**
 * determine if string is a uri
 * @param {string} str
 * @returns {Boolean}
 */
export function isUri(str) {
  const strLen = str.length,
    firstSlash = str.indexOf('/'),
    pathStart = firstSlash > -1 ? firstSlash : strLen,
    host = str.substr(0, pathStart),
    doubleSlash = host.indexOf('//'),
    colon = host.indexOf(':');

  return firstSlash !== 0 && doubleSlash === -1 && colon === -1;
}

/**
 * determine if a string is a url
 * @param  {string}  str
 * @return {Boolean}
 */
export function isUrl(str) {
  const parts = parse(str);

  return !!parts.hostname && !!parts.protocol;
}

/**
 * throw if not proper uri
 * @param  {string} str
 * @throw {Error} if not a uri
 */
export function assertUri(str) {
  if (!isUri(str)) {
    throw new TypeError(`Not a valid uri: ${str}`);
  }
}

/**
 * throw if not proper url
 * @param  {string} str
 * @throw {Error} if not a url
 */
export function assertUrl(str) {
  if (!isUrl(str)) {
    throw new TypeError(`Not a valid url: ${str}`);
  }
}

/**
 * convert url to uri (removing port and protocol)
 * @param  {string} url
 * @return {string}
 */
export function urlToUri(url) {
  const parts = parse(url);

  assertUrl(url);

  return parts.hostname + parts.pathname;
}
