'use strict';
var _ = require('lodash'),
  references = require('./references');

function getBehavior(behavior) {
  var key;

  if (_.isString(behavior)) {
    // _has: text
    return { fn: behavior, args: {} };
  } else if (_.isPlainObject(behavior) && _.isString(behavior[references.behaviorKey])) {
    /* _has:
     *   fn: text
     *   required: true
     */
    key = behavior[references.behaviorKey]; // hold onto this reference
    delete behavior[references.behaviorKey]; // delete it from the object (since the object becomes the args)
    return { fn: key, args: behavior };
  } else {
    throw new Error('Cannot parse behavior: ' + behavior);
  }
}

function getExpandedBehaviors(behaviors) {
  if (_.isString(behaviors) || _.isPlainObject(behaviors)) {
    return [getBehavior(behaviors)]; // wrap it in an array
  } else if (_.isArray(behaviors) && behaviors.length) {
    /* _has:
     *   - text
     *   -
     *     fn: other-behavior
     *     required: true
     */
    return behaviors.map(getBehavior);
  } else {
    throw new Error('Cannot parse behaviors: ' + behaviors);
  }
}

module.exports = {
  getExpandedBehaviors: getExpandedBehaviors
};