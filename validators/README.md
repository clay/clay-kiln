## Validators

Validators are rules that block publishing (errors) or notify users (warnings) when opening the publishing pane. They live in a global `window.kiln.validators` object. To add internal (kiln-specific) validators, use `validators.addError()` or `validators.addWarning()` in the `client.js`. To add them externally, use `window.kiln.validators.errors.push(yourValidator)` or `window.kiln.validators.warnings.push(yourValidator)` before the `DOMContentLoaded` event fires.

Warnings and errors have the _exact same api_, allowing us to easily swap rules between them. Each validator needs to be an object with three properties:

### label

The validation label that will be shown when publishing if your data doesn't validate.

### description

A longer description that explains the validation error.

### validate

A function that returns an array of warnings/errors (return an empty array if all rules pass). It receives a frozen `state` object with refs and components. For example, the following validator warns when `tk` exists in article headlines and paragraphs:

```js
var label = 'TKs';
  description = 'You have TKs on this page:';
  blocked = {
    article: ['primaryHeadline'],
    paragraph: ['text']
  };

/**
 * @param {{refs: object, components: Array}} state
 * @returns {[object]} errors
 */
function validate(state) {
  var errors = [],
    groups = _.groupBy(state.refs, function (value, key) {
      return references.getComponentNameFromReference(key);
    });

  _.each(blocked, function (blockedFields, groupName) {
    validateComponents(groups[groupName], blockedFields, errors);
  });

  if (errors.length) {
    return errors;
  }
}

// add it to the global validators
window.kiln.validators.warnings.push({
  label: label,
  description: description,
  validate: validate
});
```
