
# label

Appends a label to a field. This is pulled from the field's `_label` property, and falls back to using the key of the field.

## Arguments

_No arguments_

# text

A one-line text input.

## Arguments

* **type** _(optional)_ defaults to `text` if not defined
* **required** _(optional)_ set input required (blocking)
* **pattern** _(optional)_ required input pattern (blocking)
* **minLength** _(optional)_ minimum number of characters required (blocking)
* **maxLength** _(optional)_ maximum number of characters allowed (blocking)
* **placeholder** _(optional)_ placeholder that will display in the input
* **autocomplete** _(optional)_ enable/disable autocomplete on field (defaults to true)
* **step** _(optional)_ define step increments (for number type)
* **min** _(optional)_ define a minimum value (for number, date-related, and time-related types)
* **max** _(optional)_ define a maximum value (for number, date-related, and time-related  type)
* **autocapitalize** _(optional)_ enable/disable auto-capitalize on field (defaults to true). if set to "words" it will capitalize the first letter of each word

_Note:_ All of the arguments marked `(blocking)` will block saving if the input is invalid.

_Note:_ On recent mobile browsers, certain input types will have auto-capitalize disabled, e.g. emails.
