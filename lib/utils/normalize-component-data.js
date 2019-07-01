import _ from 'lodash';
import { refProp } from './references';

/**
 * normalize a potential component list
 * @param  {array} arr which may be component list or just data
 * @return {array}
 */
function normalizeComponentList(arr) {
  if (_.has(_.head(arr), refProp)) {
    // it's a component list! only return the references
    return _.map(arr, item => _.pick(item, refProp));
  } else {
    // just component data, move along
    return arr;
  }
}

/**
 * normalize a potential component property
 * @param  {object} obj which may be a component prop or just data
 * @return {object}
 */
function normalizeComponentProp(obj) {
  if (_.has(obj, refProp)) {
    // it's a component prop! only return the reference
    return { [refProp]: obj[refProp] };
  } else {
    // just component data, move along
    return obj;
  }
}

/**
 * remove child component data, leaving only their references
 * note: this removes _ref from the root of component data, so
 * we don't pollute the store
 * @param  {object} data for a component
 * @return {object}
 */
export default function normalize(data) {
  let cleanData = {};

  _.forOwn(data, (val, key) => {
    if (_.isArray(val)) {
      // possibly a component list
      cleanData[key] = normalizeComponentList(val);
    } else if (_.isObject(val)) {
      // possibly a component prop
      cleanData[key] = normalizeComponentProp(val);
    } else if (key !== refProp) {
      // add any other bits of component data
      cleanData[key] = val;
    }
  });

  return cleanData;
}
