import _ from 'lodash';
import store from '../core-data/store';

/**
 * Accepts object, turns object into hash value,
 * sets the hash value on the location
 *
 * @param {Object} props
 */
export function setHash(props) {
  var hashString = '';

  _.forIn(props, (value, key) => {
    hashString += `${key}=${value}&`;
  });

  window.location.hash = _.trimEnd(hashString, '&');
}

/**
 * Set the window's hash value to empty string
 */
export function clearHash() {
  window.location.hash = '';
}
