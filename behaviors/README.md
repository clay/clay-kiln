# Behaviors

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

When the form is created, each behavior is called *in order*. The function signature for a behavior looks like this:

```js
module.exports = function (result, args) {
  /*
  result = { el, bindings, rivets }
  args = { arguments from the schema }
   */

  return result; // pass it on
};
```

There are two objects passed into the behavior. The first (`result`) contains the element, any data bindings (for templating and event handling), and the `rivets` instance. The `bindings` object by default contains the field's `name` and `data`. Add more properties to it if you want them to appear in the template:

```js
module.exports = function (result, args) {
  var bindings = result.bindings,
    el = result.el;

  // add bindings from the data, args, etc
  bindings.label = _.startCase(bindings.name);
  bindings.required = args.required;

  var tpl = `
      <label>{ label }</label> 
      <input type="text" rv-required="required" rv-value="data" />`,
    textField = dom.create(tpl); // dom.create() makes html elements from strings

  if (el.nodeType === 1) { // a node element was passed in, we can append to it
    el.appendChild(textField);
  } else { // this is the first behavior, so a document fragment was passed in. just return the textField
    el = textField;
  }

  return {el: el, bindings: bindings, rivets: result.rivets };
};
```

Use the `rivets` instance that is passed in if you want to extend `rivets` with custom formatters, bindings, etc. ([Find out more](http://rivetsjs.com/docs/guide/#binders))

## Defining behaviors in the schema

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