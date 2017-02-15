import _ from 'lodash';
import { behaviorKey } from '../utils/references';
import htmlTags from 'html-tags';

// hash of all behaviors, added to global
window.kiln.behaviors = window.kiln.behaviors || {};

function convertNativeTagName(name) {
  // make sure we're not overwriting a native html tag
  // note: vue doesn't like the name 'text' for some reason,
  // even though it's not a native html tag name
  if (_.includes(htmlTags, name) || name === 'text') {
    return `input-${name}`;
  } else {
    return name;
  }
}

/**
 * add a behavior to the hash. used by edit.js to add internal behaviors
 * @param {string}   name
 * @param {Function} vueComponent vue component
 */
export function add(name, vueComponent) {
  name = convertNativeTagName(name);

  // note: this WILL overwrite behaviors already in the hash,
  // allowing people to use custom versions of our core behaviors
  window.kiln.behaviors[name] = vueComponent;
}

/**
 * fail gracefully when people specify behaviors that don't exist
 * e.g. still add the other behaviors, but warn them
 * @param  {object} behavior expanded behavior definition
 * @return {boolean}
 */
function omitMissingBehaviors(behavior) {
  const name = behavior[behaviorKey],
    found = !!window.kiln.behaviors[name];

  if (!found) {
    console.warn('Behavior "' + name + '" not found. Make sure you add it!');
  }

  return found;
}

/**
 * expand a single behavior
 * @param  {*} behavior
 * @return {{}}
 */
function expandBehavior(behavior) {
  if (_.isString(behavior) && behavior.length) {
    // _has: text
    return { fn: behavior, args: {} };
  } else if (_.isPlainObject(behavior) && _.isString(behavior[behaviorKey])) {
    /* _has:
     *   fn: text
     *   required: true
     */
    return { fn: behavior[behaviorKey], args: _.omit(behavior, behaviorKey) };
  } else {
    throw new Error('Cannot parse behavior: ' + behavior);
  }
}

/**
 * _has: 'text' or _has: { thing: thing } is shorthand
 * @param {*} behaviors
 * @returns {Boolean|*}
 */
function isShortHandDefinition(behaviors) {
  return _.isString(behaviors) || _.isPlainObject(behaviors);
}

/**
 * convert the behavior name to `input-${name}` if it conflicts with
 * a native html tag name, because vue components aren't allowed to conflict
 * with native html tag names
 * @param  {object} behavior
 * @return {object}
 */
function mungeNativeTagNames(behavior) {
  behavior[behaviorKey] = convertNativeTagName(behavior[behaviorKey]);
  return behavior;
}

/**
 * get the slot each behavior specifies
 * @param  {object} behavior
 * @return {object}
 */
function getBehaviorSlots(behavior) {
  const name = behavior[behaviorKey],
    slot = _.get(window, `kiln.behaviors.${name}.slot`);

  if (!slot) {
    console.warn('Behavior "' + name + '" has no slot specified. Make sure you add it!');
  } else {
    behavior.slot = slot;
  }

  return behavior;
}

/**
 * get an array of expanded behaviors
 * @param  {*} behaviors
 * @return {[]}           array of {fn: string, args: {}}
 */
export function expand(behaviors) {
  behaviors = behaviors;

  if (isShortHandDefinition(behaviors)) {
    return [expandBehavior(behaviors)];
  }

  return behaviors.map(expandBehavior).map(mungeNativeTagNames).filter(omitMissingBehaviors).map(getBehaviorSlots);
}
