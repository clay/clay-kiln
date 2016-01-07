# Behaviors

```
behaviors/
  my-behavior.js - behavior code
  my-behavior.test.js - test code, runs automatically in karma
  my-behavior.scss - styles, can also be straight css
```

## Defined in the schema

Behaviors are added to fields in your `schema.yaml`. They are an array of strings and/or objects (with a `fn` property and any number of arguments):

```yaml
myField:
  _has:
    - text
    -
      fn: soft-maxlength
      maxLength: 80
```

### Field Properties

Fields can have certain properties. These are prefixed with underscores.

* **_has:** An array of behaviors
* **_componentList:** A special type of field that contains components. These fields do _not_ have behaviors, labels, or display values, but may have placeholders
* **_label:** This is a human-readable label that will be used by the pre-publishing validators, and can also be consumed by the `label` behavior
* **_display:** This specifies what kind of form the field should use. The options are `inline`, `overlay` (the default), and `settings` (to only display in the component settings form)
* **_placeholder:** This is an object that specifies what placeholders should be displayed when the field's data is empty. You can specify `text` and `height` (a string, e.g. `200px`)

#### Defining Behaviors

While you can write out all behaviors as an array of objects, there's syntactical sugar to make it more concise. Here are examples, in increasing order of complexity:

```yaml
# If you have a single behavior with no arguments, use a string
has_one_function_with_no_args:
  _has: text # specifying a string will point to the behavior, e.g. behaviors/text.js

# if you have a single behavior but it has arguments, use an object
has_one_function_with_args:
  _has:
    fn: text # fn points to the behavior, e.g. behaviors/text.js
    required: true

# if you have multiple behaviors, use an array
has_multiple_functions:
  _has:
    - text
    - label

# you can mix and match strings (behaviors without arguments) and objects (behaviors with arguments) in your arrays
has_multiple_functions_with_args:
  _has:
    -
      fn: text
      type: url
    - label
    -
      fn: description
      value: Write stuff here
    - required
```

#### Defining Component Lists

Component Lists are a special type of field. These fields don't have behaviors or labels, and don't appear in forms, but rather contain lists of component references and the logic for adding and removing components.

```yaml
content:
  _componentList: true
```

Simply specifying `true` will create a component list that may contain _any_ component installed in your Clay instance (both internal components and any installed via npm). This is used primarily for component lists inside layouts, where users have the maximum amount of creative freedom to add and remove components.

If `_componentList` is an object, you can specify a list of components to `exclude` (blacklisting) or `include` (whitelisting).

```yaml
# the content of our article, where we ONLY want to include certain components
articleContent:
  _componentList:
    include:
      - paragraph
      - image

# a sidebar area where we want to allow every component EXCEPT certain ones
sideBarArea:
  _componentList:
    exclude:
      - article
      - paragraph
      - image
```

Component lists don't use `_label` or `_display` (and will ignore them if you specify them), but they allow `_placeholder`. It's recommended to add placeholders to component lists, which will display when that list is empty.

**Note:** In the future you will be able to [specify a minimum and maximum number of components](https://github.com/nymag/clay-kiln/issues/298) in your component lists.

#### Defining Placeholders

By default, placeholders are displayed when a field is empty. If you would like the placeholder to _always_ appear (e.g. for components with no visible aspects, or for things like ads which rely on client-side js which is suppressed in edit mode), add `permanent: true` to the placeholder object. This will give the placeholder a slightly different styling and prevent it from disappearing when data is added.

```yaml
adName:
  _has: text
  _placeholder:
    text: AD
    height: 300px
    permanent: true
```

When deciding how to add placeholders, keep these things in mind:

* Placeholders will display when you add `data-editable="fieldName"` or `data-placeholder="fieldName"` (though the latter will _not_ be clickable) to the component's template
* You can add newlines into placeholder text, either by using yaml's [multiline strings](http://stackoverflow.com/questions/3790454/in-yaml-how-do-i-break-a-string-over-multiple-lines) or by adding `\n`, e.g. `text: ARTICLE BODY\n\nClick to add #content`
* Placeholder height should reflect how the component will look when data is added to the field. A single line of text will be short, while a component list will probably be taller.
* Placeholder height is a string, so you may specify different units if applicable.
* Placeholders are specified in the component schema, so all instances of that component will have the same placeholder text, height, and logic.

### Groups

Groups are useful when you want to open a form with multiple fields (inline or in overlays), or when you want to guarantee the order of fields in your component settings form.

#### Creating a Group

In the root of your schema.yml, add a `_groups` object that contains a `fields` array.

```yaml
title:
  _has: text
url:
  _has: text

_groups:
  myGroup:
    field:
      - title
      - url
```

You can add field properties to groups, which will work the same way as with fields.

```yaml
_groups:
  inlineStuff:
    fields:
      - title
      - url
    _label: Inline Stuff
    _display: inline
```

If you add a `_placeholder` to a group, you _must_ either make it permanent (with `permanent: true`) _or_ specify a field it should check (with `ifEmpty: fieldName`). It will display the placeholder when that field is empty.

```yaml
_groups:
  inlineStuff:
    fields:
      - title
      - url
    _label: Inline Stuff
    _display: inline
    _placeholder:
      text: Click here to add stuff
      height: 40px
      ifEmpty: title
```

#### Settings Group

By default, kiln will look through your fields to generate the component settings form. It will add any field with `_display: settings` to the form, but (because schemae are objects) there's no guarantee that the order you write your fields in the schema will be the order they appear in the form.

If you want to guarantee the field order in your component settings form, you can create the `settings` group manually.

```yaml
_groups:
  settings:
    fields:
      - title
      - url
```

You don't need to specify `_label` (the form will be called "<Component Name> Settings"), `_display`, or `_placeholder` for the `settings` group.

## Called for each field

When the form is created, each behavior is called *in order*. The function for a behavior looks like this:

```js
module.exports = function (result, args) {
  /*
  result = { el, bindings, binders, formatters, name }
  args = { arguments from the schema }
   */

  return result; // pass it on
};
```

There are two objects passed into the behavior. The first (`result`) contains the element, data bindings (that will be added to the form's bindings object under the field name), the field name, and the field's formatters and binders. The `bindings` object by default contains the field's `name`, `label`, and `data` (including the schema). Add more properties to it if you want them to appear in the template:

```js
module.exports = function (result, args) {
  var bindings = result.bindings,
    name = result.name,
    el = result.el;

  // add bindings from the data, args, etc
  bindings.required = args.required;

  var tpl = `
      <input type="text" rv-required="${name}.required" rv-value="${name}.data.value" />`,
    textField = dom.create(tpl); // dom.create() makes html elements from strings

  el.appendChild(textField);

  return result;
};
```

`binders` and `formatters` are singletons that are added to the form's `rivets` instance. ([Find out more about binders and formatters](http://rivetsjs.com/docs/guide/#binders))

Behaviors should return the first argument passed in (the `result` object), but may return a promise that resolves to that object. This is useful if your behavior needs to make api calls or do other async things.

## How to define arguments for your behavior

It's best practice to write a comment at the top of your `<behavior>.js` file describing the arguments it accepts. This acts as a sort of API document for developers writing schemas against this behavior. Here's an example:

```js
/*
  Arguments for the autocomplete behavior:

  api {string} points to the api that will be used for autocomplete
  deleteIfEmpty {boolean} if true, this will call DELETE against the api when you delete an item
 */
```
