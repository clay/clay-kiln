var label, description,
  searchTexts = ['TK', 'tktk'],
  articleFields = ['primaryHeadline', 'teaser'],
  paragraphField = 'text',
  _ = require('lodash'),
  stripTags = require('striptags'),
  references = require('../services/references'),
  refProp = references.referenceProperty,
  cutStart = 20,
  cutEnd = 20;

label = 'Ban TKs';
description = 'Any TK or tktk in the article\'s primary headline, teaser or in any paragraph cannot be published.';

/**
 * Return first value of list to be found in str
 * @param {string} str
 * @param {[string]} list
 * @returns {string|null}
 */
function findFirstText(str, list) {
  var i;

  for (i = 0; i < list.length; i++) {
    if (str.indexOf(list[i]) > -1) {
      return list[i];
    }
  }
  return null;
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
 * @param {string} value
 * @param {object} data
 * @param {string} tkText
 * @returns {string}
 */
function getPreview(value, data, tkText) {
  var index;

  if (_.isString(value)) {
    index = value.indexOf(tkText);

    if (index > cutStart) {
      value = '...' + value.substr(index - cutStart);
      index = index - (index - cutStart) + 3;
    }

    if (value.length > index + cutEnd) {
      value = value.substr(0, index + cutEnd + tkText.length) + '...';
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
 * @param {string} tkText
 */
function addError(component, fieldName, errors, tkText) {
  var ref = component[refProp],
    componentName = ref && references.getComponentNameFromReference(ref),
    data = component && component[fieldName],
    schema = data._schema,
    label = schema && schema._label,
    value = data && data.value && stripTags(data.value),
    error = {
      ref: ref,
      fieldName: fieldName,
      label: getLabel(componentName, label, ref),
      preview: getPreview(value, data, tkText)
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
      value = field && field.value && stripTags(field.value),
      tkText = value && findFirstText(value, searchTexts);

    if (tkText) {

      addError(component, paragraphField, errors, tkText);

    }
  });

  _.each(groups.article, function (component) {
    _.each(articleFields, function (fieldName) {
      var field = component[fieldName],
        value = field && field.value && stripTags(field.value),
        tkText = value && findFirstText(value, searchTexts);

      if (tkText) {

        addError(component, fieldName, errors, tkText);

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
