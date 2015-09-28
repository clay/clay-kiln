## Validators

Validators are rules that block publishing of articles. They live in a global `window.kiln.validators` array. To add internal (kiln-specific) validators, use `validators.add()` in the `client.js`. To add them externally, use `window.kiln.validators.push(yourValidator)` before the `DOMContentLoaded` event fires.

Each validator needs to be an object with three properties:

### label

The validation label that will be shown when publishing if your data doesn't validate.

### description

A longer description that explains the validation error.

### validate

A function that returns an `errors` array (return an empty array if there are no errors). It receives a frozen `state` object with refs and components. For example, the following validator blocks `TK` and `tktk` in article headlines and paragraphs:

```js
var label = 'TKs';
  description = 'Any TK in the article cannot be published:';
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
window.kiln.validators.push({
  label: label,
  description: description,
  validate: validate
});
```
