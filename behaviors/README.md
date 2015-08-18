# Behaviors

```
behaviors/
  my-behavior.js - behavior code
  my-behavior.test.js - test code, runs automatically in karma
  my-behavior.scss - styles, can also be straight css
```

## Defined in the schema

Behaviors are added to fields in your `schema.yaml`. They are an array of objects, with a `fn` property and any number of arguments:

```yaml
my-field:
  _has:
    -
      fn: text
      required: true
      placeholder: This is my placeholder
    -
      fn: soft-maxlength
      maxLength: 80
```

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

## How to define behaviors in the schema

While you can write out all behaviors as an array of objects, there's syntactical sugar to make it more concise. Here are examples, in increasing order of complexity:

```yaml
has_one_function_with_no_args:
  _has: text
has_one_function_with_args:
  _has:
    fn: text
    required: true
has_multiple_functions:
  _has:
    - text
    -
      fn: soft-maxlength
      value: 80
has_transcluded_functions:
  _has:
    fn: horizontal-list
    required: true
    each:
      name:
        _has:
          fn: text
          required: true
      twitter:
        _has: text
```

## How to define arguments for your behavior

It's best practice to write a comment at the top of your `<behavior>.js` file describing the arguments it accepts. This acts as a sort of API document for developers writing schemas against this behavior. Here's an example:

```js
/*
  Arguments for the autocomplete behavior:

  api {string} points to the api that will be used for autocomplete
  deleteIfEmpty {boolean} if true, this will call DELETE against the api when you delete an item
 */
```
