import _ from 'lodash';

/**
 * normalize site path
 * @param  {string} str
 * @return {string}
 */
function normalizePath(str) {
  if (str.length > 1) {
    return str;
  } else {
    return ''; // because routes start with slashes, and we want to avoid foo.com//route
  }
}

/**
 * normalize site data
 * @param  {object} rawData
 * @param  {object} [location] to stub for testing
 * @return {object}
 */
export function normalizeSiteData(rawData, location) {
  location = location || /* istanbul ignore next: can't stub window.location */ window.location;

  return _.assign({}, rawData, {
    path: normalizePath(rawData.path),
    port: location.port,
    prefix: `${rawData.host}${normalizePath(rawData.path)}`,
    protocol: rawData.protocol || location.protocol.replace(':', '')
  });
}
