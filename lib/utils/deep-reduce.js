import _ from 'lodash';
import { isComponent, refProp } from '../utils/references';

export const ignoredKeys = [
  '_components',
  '_componentSchemas',
  '_pageData',
  '_layoutRef',
  refProp,
  '_self',
  'blockParams',
  'filename',
  'knownHelpers',
  'locals',
  'media',
  'site',
  'state',
  'template'
];

/**
 * deeply reduce a tree of components
 * @param {object} result
 * @param  {*}   tree
 * @param  {Function} fn   to call when component object is found
 * @returns {object}
 */
export default function deepReduce(result, tree, fn) {
  if (_.isObject(tree) && tree[refProp] && isComponent(tree[refProp])) {
    // we found a component!
    fn(tree[refProp], tree);
  }

  if (_.isArray(tree)) {
    // check for arrays first
    _.each(tree, (item) => deepReduce(result, item, fn));
  } else if (_.isObject(tree)) {
    // then check for objects
    _.forOwn(tree, function (val, key) {
      if (_.head(key) !== '_' && !_.includes(ignoredKeys, key)) {
        // don't iterate through any of the templating/amphora metadata or locals/state
        deepReduce(result, val, fn);
      }
    });
  }
  return result;
}
