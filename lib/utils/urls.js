const protocolPattern = /^((http|https):\/\/)/,
  // `scheme://` followed straight away by a host: anything else (`http:///x`, `http:/x`,
  // leading whitespace, no scheme) is not a url here, as it never was with url-parse
  urlPattern = /^[a-z][a-z0-9+.-]*:\/\/([^\s/\\?#]+)/i;

/**
 * add port to uri if it needs it
 * @param {string} uri
 * @param {object} [location] to stub for testing
 * @returns {string}
 */
export function addPort(uri, location) {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;

  // hostname doesn't have port, but host does.
  // so remove the port (if it exists) to normalize it, then add it back in (if it exists)
  return uri.replace(location.host, location.hostname).replace(location.hostname, location.host);
}

/**
* Check url string for protocol and if it doesn't have one, add the protocol of the current url
* @param {string} url
* @param {object} location - only passed in testing
* @return {string}
*/
export function addProtocol(url, location) {
  if (!protocolPattern.test(url)) {
    location = location || /* istanbul ignore next: can't stub window.location */ window.location;

    url = `${location.protocol}//${url}`;
  }

  return url;
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
 * split a url into its hostname and path, the way url-parse used to (and without it):
 * the hostname comes from the browser's own URL (lowercased, port and credentials removed),
 * the path is kept as written (URL would percent-encode it) and without the query or hash
 * @param  {string} str
 * @return {{hostname: string, pathname: string}|null} null if it isn't an absolute url with a host
 */
function parseUrl(str) {
  const match = urlPattern.exec(str);
  let url;

  if (!match) {
    return null;
  }

  try {
    url = new URL(str);
  } catch (e) {
    return null; // for example a port that isn't one
  }

  return {
    hostname: url.hostname,
    // url-parse read backslashes in the path as slashes
    pathname: /^[^?#]*/.exec(str.slice(match[0].length))[0].replace(/\\/g, '/')
  };
}

/**
 * determine if a string is a url
 * @param  {string}  str
 * @return {Boolean}
 */
export function isUrl(str) {
  return !!parseUrl(str);
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
  assertUrl(url);

  const parts = parseUrl(url);

  return parts.hostname + parts.pathname;
}
