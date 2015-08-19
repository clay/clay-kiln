var _ = require('lodash'),
  references = require('./references'),
  label = require('./label'),
  promises = require('./promises'),
  // hash of all behaviors
  behaviorsHash = {};

/**
 * add a behavior to the hash. called by users who want to create custom behaviors
 * @param {string}   name
 * @param {Function} fn   usually from a browserify require() call
 */
function add(name, fn) {
  // note: this WILL overwrite behaviors already in the hash,
  // allowing people to use custom versions of our core behaviors
  behaviorsHash[name] = fn;
}

function omitMissingBehaviors(behavior) {
  var name = behavior[references.behaviorKey],
    found = !!behaviorsHash[name];

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
  } else if (_.isPlainObject(behavior) && _.isString(behavior[references.behaviorKey])) {
    /* _has:
     *   fn: text
     *   required: true
     */
    return { fn: behavior[references.behaviorKey], args: _.omit(behavior, references.behaviorKey) };
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
 * get an array of expanded behaviors
 * @param  {*} behaviors
 * @return {[]}           array of {fn: string, args: {}}
 */
function getExpandedBehaviors(behaviors) {
  if (isShortHandDefinition(behaviors)) {
    return [expandBehavior(behaviors)];
  }

  return behaviors.map(expandBehavior);
}

/**
 * run behaviors for a field, in order
 * @param {object} context
 * @param {*} context.value
 * @param {object} context._schema
 * @return {Promise}
 */
function run(context) {
  var contextName = _.get(context, '_schema._name'),
    contextLabel = label(contextName, context._schema),
    behaviors = getExpandedBehaviors(context._schema[references.fieldProperty]),
    runnableBehaviors = _.filter(behaviors, omitMissingBehaviors);

  return promises.transform(runnableBehaviors, function (currentContext, behavior) {
    // apply behaviours
    var name = behavior[references.behaviorKey];

    return behaviorsHash[name](currentContext, behavior.args);
  }, {
    el: document.createDocumentFragment(),
    bindings: { label: contextLabel, name: contextName, data: context },
    binders: {},
    formatters: {},
    name: contextName
  });
}

exports.add = add;
exports.run = run;
exports.getExpandedBehaviors = getExpandedBehaviors;
