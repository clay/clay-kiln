var _ = require('lodash'),
  dom = require('@nymag/dom'),
  edit = require('./edit'),
  control = require('./edit/control'),
  promises = require('./promises'),
  references = require('./references'),
  refAttr = references.referenceAttribute,
  refAtrrSelector = '[' + refAttr + ']';

/**
 * True if rule is enabled.
 * @param {object} rule
 * @returns {boolean}
 */
function isRuleEnabled(rule) {
  return rule.enabled !== false;
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
      if (ref && data) {
        obj[ref] = data;
      }
    });
  }, {});
}

/**
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
 * map over all rules, running them and compacting the resulting errors (if any)
 * @param {object} rules
 * @param {object} state (read-only)
 * @returns {Promise}
 */
function mapRules(rules, state) {
  return promises.props({
    errors: promises.map(_.filter(rules.errors, isRuleEnabled), validateRule(state)),
    warnings: promises.map(_.filter(rules.warnings, isRuleEnabled), validateRule(state))
  }).then(function (results) {
    return {
      errors: _.compact(results.errors),
      warnings: _.compact(results.warnings)
    };
  });
}

/**
 * @param {object} rules
 * @param {array} rules.errors
 * @param {array} rules.warnings
 * @returns {Promise}
 */
function validate(rules) {
  var refs = getLatestRefMap(),
    components = getComponentMap(refs);

  // run rules async
  return promises.join(getLatestRefDataMap(refs), components)
    .then(function (result) {
      var state = control.setReadOnly({ refs: result[0], components: result[1] });

      return mapRules(rules, state);
    });
}

module.exports.validate = validate;
