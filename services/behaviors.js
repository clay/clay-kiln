'use strict';
var _ = require('lodash'),
  references = require('./references');

function getExpandedBehaviors(behaviors) {
  if (_.isString(behaviors)) {
    // _has: text
    return [{ fn: behaviors, args: {} }];
  } else if (_.isObject(behaviors) && _.isString(behaviors[references.behaviorKey])) {
    /* _has:
     *   fn: text
     *   required: true
     */
    delete behaviors[references.behaviorKey];
    return [{ fn: behaviors[references.behaviorKey], args: behaviors }];
  } else if (_.isArray(behaviors)) {
    /* _has:
     *   - text
     *   -
     *     fn: other-behavior
     *     required: true
     */
    return behaviors.map(getExpandedBehaviors); // recursive!
  }
}

module.exports = {
  getExpandedBehaviors: getExpandedBehaviors
};