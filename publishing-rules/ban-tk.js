var label, description,
  tkText = 'TK',
  articleFields = ['primaryHeadline', 'teaser'],
  _ = require('lodash'),
  references = require('../services/references');

label = 'Ban TKs';
description = 'TKs are not allowed';

function addError(component, fieldName, errors) {
  var index,
    schema = component._schema,
    componentLabel = schema[fieldName]._label,
    value = component[fieldName].value,
    error = {
      ref: component._ref,
      fieldName: fieldName
    };

  if (componentLabel) {
    error.label = componentLabel;
  }

  if (_.isString(value)) {
    index = value.indexOf(tkText);

    if (index > 20) {
      value = '...' + value.substr(index - 15);
    }

    if (value.length > index + 16) {
      value = value.substr(0, index + 13) + '...';
    }

    error.value = value;
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
