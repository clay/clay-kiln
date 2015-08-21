var label, description,
  requiredBehavior = 'required',
  _ = require('lodash'),
  stripTags = require('striptags'),
  references = require('../services/references'),
  refProp = references.referenceProperty,
  fieldProp = references.fieldProperty;

label = 'Required';
description = 'Some fields are required for publication.';

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
 * @returns {boolean}
 */
function isFieldRequired(fieldDefinition) {
  return _.isObject(fieldDefinition) && _.any(fieldDefinition[fieldProp], function (behavior) {
    return behavior === requiredBehavior || behavior.fn === requiredBehavior;
  });
}

/**
 * @param {object} component
 * @param {string} fieldName
 * @returns {*}
 */
function getValue(component, fieldName) {
  var value = component[fieldName] && component[fieldName].value;

  value = value && (stripTags(value)).trim();
  return value;
}

/**
 * @param {{refs: object, components: Array}} state
 * @returns {[object]}
 */
function validate(state) {
  var errors = [];

  _.each(state.refs, function (component) {
    _.each(component._schema, function (definition, fieldName) {
      if (isFieldRequired(definition) && !getValue(component, fieldName)) {
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
