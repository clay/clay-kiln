var label, description,
  behaviorName = 'soft-maxlength',
  _ = require('lodash'),
  stripTags = require('striptags'),
  references = require('../services/references'),
  refProp = references.referenceProperty,
  fieldProp = references.fieldProperty;

label = 'Max Length';
description = 'Some field values must be less than a certain length for consistent formatting across all syndications.';

/**
 * @param {string} value
 * @returns {string}
 */
function cleanValue(value) {
  var clean = stripTags(value);

  clean = clean.replace(/(\u00a0|&nbsp;|&#160;)/ig, ' '); // remove &nbsp;
  return clean;
}

/**
 * @param {string} componentName
 * @param {string} label
 * @param {string} ref
 * @returns {string}
 */
function getLabel(componentName, label, ref) {
  if (componentName) {
    return _.compact([_.startCase(componentName), label]).join(' ');
  } else {
    // don't change this; fix schmea
    return ref;
  }
}

/**
 * @param {object} component
 * @param {string} fieldName
 * @param {[object]} errors
 */
function addError(component, fieldName, errors) {
  var ref = component[refProp],
    componentName = ref && references.getComponentNameFromReference(ref),
    schema = component._schema[fieldName],
    label = schema && schema._label,
    error = {
      ref: ref,
      fieldName: fieldName,
      label: getLabel(componentName, label, ref)
    };

  errors.push(error);
}

/**
 * @param {*} fieldDefinition  field definition as defined in schema
 * @returns {object}
 */
function getBehavior(fieldDefinition) {
  return _.isObject(fieldDefinition) && _.find(fieldDefinition[fieldProp], function (behavior) {
      // only objects
      return behavior.fn === behaviorName && _.isNumber(behavior.value);
    });
}

/**
 * @param {object} component
 * @param {string} fieldName
 * @param {object} behaviorDefinition
 * @returns {boolean}
 */
function isGoodLength(component, fieldName, behaviorDefinition) {
  var value = component[fieldName] && component[fieldName].value;

  value = value && (stripTags(value)).trim();

  value = value && cleanValue(value);

  return !!value && value.length > behaviorDefinition.value;
}

/**
 * @param {{refs: object, components: Array}} state
 * @returns {[object]}
 */
function validate(state) {
  var errors = [];

  _.each(state.refs, function (component) {
    _.each(component._schema, function (definition, fieldName) {
      var behaviorDefinition = getBehavior(definition);

      if (behaviorDefinition && isGoodLength(component, fieldName, behaviorDefinition)) {
        addError(component, fieldName, errors);
      }
    });
  });

  if (errors.length) {
    return errors;
  }
}

module.exports.label = label;
module.exports.description = description;
module.exports.validate = validate;
