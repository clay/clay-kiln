var label, description,
  tkText = 'TK',
  articleFields = ['primaryHeadline', 'teaser'],
  _ = require('lodash'),
  references = require('../services/references');

label = 'Ban TKs';
description = 'TKs are not allowed';

function addError(component, fieldName, errors) {
  var index, preview,
    label = component.schema[fieldName]._label,
    value = component[fieldName].value,
    error = {
      ref: component._ref,
      fieldName: fieldName
    };

  if (label) {
    error.label = label;
  }

  if (_.isString(value)) {
    index = value.indexOf(tkText);

    if (index > 10) {

    }
  }

  errors.push(error);
}

function validate(state) {
  var errors = [],
    groups = _.groupBy(state.refs, function (value) {
      return references.getComponentNameFromReference(value._ref);
    });

  _.each(groups.paragraph, function (component) {
    var fieldName = 'text';

    if (component[fieldName].value.indexOf(tkText) > -1) {

      addError(component, fieldName, errors);

    }
  });

  _.each(groups.article, function (component) {
    _.each(articleFields, function (fieldName) {
      if (component[fieldName].value.indexOf(tkText) > -1) {

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
