console.log(__filename);

var label, description,
  _ = require('lodash');

label = 'Text Max Length';
description = 'Some fields have limits to the length of text because of layout limitations.';

function validate(state) {
  var errors = [],
    marks = [];

  _.each(state.refs, function (componentData, ref) {
    _.each(componentData._schema, function (field, fieldName) {
      _.each(field._has, function (behavior) {
        if (behavior.fn === 'soft-maxlength') {
          marks.push({
            ref: ref,
            componentData: componentData,
            fieldName: fieldName,
            field: field,
            behavior: behavior
          });
        }
      });
    });
  });

  _.each(marks, function (mark) {
    var fieldData = mark.componentData[mark.fieldName],
      fieldValue = fieldData.value;

    if (_.isString(fieldValue) && fieldValue.length > mark.behavior.value) {
      errors.push({
        ref: mark.ref,
        fieldName: mark.fieldName
      });
    }
  });

  if (errors.length) {
    return errors;
  }
}

module.exports.label = label;
module.exports.description = description;
module.exports.validate = validate;

console.log(__filename);