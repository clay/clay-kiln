
# checkbox-group

A group of checkboxes, allowing the user to toggle on or off related items.

## Arguments

* **options** _(required)_ an array of checkboxes

Each option should be an object with `name` and `value` properties. Use the bootstrap to specify which should be toggled by default, e.g.

```yaml
field1:
  option1: true
  option2: false
  option3: false
```

# checkbox

A single checkbox, allowing the user to toggle something on or off.

## Arguments

* **label** _(required)_ the checkbox label

In practice, it's usually best to use a conversational tone / question as the checkbox label, with the field label being shorter. e.g.

```yaml
field1:
  _label: Special Logo
  _has:
    fn: checkbox
    label: Should we use a special logo in this component?
```

# codemirror

A syntax-highlighted text area. Useful for writing css, sass, yaml, or other code in the editor.

## Arguments

* **mode** _(required)_ the language used

The mode of the editor sets syntax highlighting, linting, and other functionality. Currently, we support these modes:

* `text/css` - css mode
* `text/x-scss` - sass/scss mode (useful for per-instance styles)
* `text/x-yaml` - yaml mode (useful for writing elasticsearch queries)

_Note:_ We will add more supported modes as we find use cases for them. See [this link](http://codemirror.net/mode/) for the full list of modes supported in codemirror.

# description

Appends a description to a field.

## Arguments

* **value** _(required)_ field description, allows html

# label

Appends a label to a field. This is pulled from the field's `_label` property, and falls back to using the key of the field.

## Arguments

_No arguments_

# lock

Append a lock button to an input. The input will be locked until the user clicks the lock button. This provides a small amount of friction before editing important (and rarely-edited) fields, similar to macOS's system preferences.

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
