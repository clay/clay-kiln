var _ = require('lodash'),
  dom = require('./dom'),
  edit = require('./edit'),
  promises = require('./promises'),
  references = require('./references'),
  refAttr = references.referenceAttribute,
  refAtrrSelector = '[' + refAttr + ']';

function isRuleEnabled(rule) {
  return rule.enabled !== false;
}

function filterEmpty(result) {
  return _.filter(result, _.identity);
}

function getComponentUri(name) {
  return '/components/' + name;
}

function setReadOnly(obj) {
  _.forOwn(obj, function (value) {
    if (typeof value === 'object') {
      setReadOnly(value);
    }
  });

  if (Object.isFrozen && !Object.isFrozen(obj)) {
    Object.freeze(obj);
  }
  return obj;
}

/**
 * Saves unique values only
 * @returns {Array}
 */
function getLatestRefMap() {
  return _.uniq(_.map(dom.findAll(refAtrrSelector), function (el) {
    return el.getAttribute(refAttr);
  }));
}

/**
 * @param {Array} refs
 * @returns {Array}
 */
function getComponentMap(refs) {
  return _.uniq(_.map(refs, references.getComponentNameFromReference));
}

/**
 * @param {Array} refs
 * @returns {Promise}
 */
function getLatestRefDataMap(refs) {
  return promises.transform(refs, function (obj, ref) {
    return edit.getData(ref).catch(function () {}).then(function (data) {
      obj[ref] = data;
    });
  }, {});
}

/**
 *
 * @param {{refs: object, components: Array}} state
 * @returns {function}
 */
function validateRule(state) {
  return function (rule) {
    return promises.attempt(function () {
      var result = rule.validate(state);

      if (_.isArray(result) && result.length > 0) {
        return {rule: rule, errors: result};
      }
    }).catch(function (error) {
      return {rule: rule, errors: [error]};
    });
  };
}

/**
 *
 * @param {Array} rules
 * @returns {Promise}
 */
function validate(rules) {
  var refs = getLatestRefMap(),
    components = getComponentMap(refs);

  // run rules async
  return promises.join(getLatestRefDataMap(refs), components)
    .then(function (result) {
      var state = setReadOnly({ refs: result[0], components: result[1] });

      return promises.map(_.filter(rules, isRuleEnabled), validateRule(state));
    })
    .then(filterEmpty);
}

module.exports.validate = validate;
