var label, description,
  tkText = 'TK',
  articleFields = ['primaryHeadline', 'teaser'],
  paragraphField = 'text',
  _ = require('lodash'),
  references = require('../services/references'),
  refProp = references.referenceProperty,
  cutStart = 20,
  cutEnd = 20;

label = 'Ban TKs';
description = 'TKs are not allowed';

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
 * @param {string} value
 * @param {object} data
 * @returns {string}
 */
function getPreview(value, data) {
  var index;

  if (_.isString(value)) {
    index = value.indexOf(tkText);

    if (index > cutStart) {
      value = '...' + value.substr(index - cutStart);
    }

    if (value.length > index + cutEnd) {
      value = value.substr(0, index + cutEnd) + '...';
    }

    return value;
  } else {
    // don't change this; fix schmea
    return JSON.stringify(data);
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
    data = component && component[fieldName],
    schema = data._schema,
    label = schema && schema._label,
    value = data && data.value,
    error = {
      ref: ref,
      fieldName: fieldName,
      label: getLabel(componentName, label, ref),
      preview: getPreview(value, data)
    };

  errors.push(error);
}

/**
 * @param {{refs: object, components: Array}} state
 * @returns {[object]}
 */
function validate(state) {
  var errors = [],
    groups = _.groupBy(state.refs, function (value, key) {
      return references.getComponentNameFromReference(key);
    });

  _.each(groups.paragraph, function (component) {
    var field = component[paragraphField],
      value = field && field.value;

    if (_.isString(value) && value.indexOf(tkText) > -1) {

      addError(component, paragraphField, errors);

    }
  });

  _.each(groups.article, function (component) {
    _.each(articleFields, function (fieldName) {
      var field = component[fieldName],
        value = field && field.value;

      if (_.isString(value) && value.indexOf(tkText) > -1) {

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
