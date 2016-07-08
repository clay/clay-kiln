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
    - text # points to behaviors/text.js
    -
      fn: soft-maxlength # points to behaviors/soft-maxlength.js
      maxLength: 80
```

## Referenced in the template

Once a field is defined in the schema, you can add a `data-editable` attribute to an element in your component's template. When a user clicks on that element, it will open a form containing that field.

```html
<div data-editable="myField"></div>
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
hasOneFunctionWithNoArguments:
  _has: text # specifying a string will point to the behavior, e.g. behaviors/text.js

# if you have a single behavior but it has arguments, use an object
hasOneFunctionWithArguments:
  _has:
    fn: text # fn points to the behavior, e.g. behaviors/text.js
    required: true

# if you have multiple behaviors, use an array
hasMultipleFunctions:
  _has:
    - text
    - label

# you can mix and match strings (behaviors without arguments) and objects (behaviors with arguments) in your arrays
hasMultipleFunctionsWithArguments:
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

#### Defining Display

There are three ways we display fields and forms in Kiln, `inline`, `overlay`, and `settings`. While it is possible to display any field in any of these ways, certain displays are better for certain types of content.

**Inline** is best when there's a one-to-one match between how your component looks and how it's edited. Some examples:

* clicking into a paragraph should display a single inline text area
* clicking on a header should allow you to edit that header (a single text field) in place
* clicking on an image should allow you to upload or change that image

**Overlay** is best when there's a one-to-many match between how your component looks and how it's edited. Some examples:

* an article headline looks like a single line of text, but has multiple fields for short, medium, social, and seo headlines
* a link looks like...a link, but has fields for the link text, url, title, and whether it should open in a new tab or not

**Settings** is best when there's a many-to-many match between how your component looks and how it's edited, or when certain fields affect the entirety of a component. Some examples:

* an instance of a share component can enable and disable many social media services at once
* an article component has data that is never displayed on the article page, but is used to generate rss feeds and sitemaps
* a paragraph component has a feature to toggle [drop caps](https://www.smashingmagazine.com/2012/04/drop-caps-historical-use-and-current-best-practices/)
* a feed component has a field that specifies the elasticsearch query it uses to populate items

These are not hard and fast rules, so feel free to experiment!

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

Placeholders can display the value of a field, which is useful for components not visible during edit mode, e.g. third-party JavaScript. The syntax for displaying a value in the placeholder text is `${fieldName}`, which is similar to JavaScript [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). Note that `permanent: true` must be set. Example schemas:

```yaml
# single field with value in placeholder text
videoId:
  _placeholder:
    text: Video Id ${videoId}
    permanent: true

# group with values in placeholder text
_groups:
  group1:
    fields:
      - name
      - description
    _placeholder:
      text: Ad Unit ${name} ${description}
      permanent: true
```

Placeholders will display when you add `data-editable="fieldName"` in your component's template. If you're using a permanent placeholder and/or you don't want the user to click through and open a form, you can specify `data-placeholder="fieldName"` instead.

When deciding how to add placeholders, keep these things in mind:

* You can add newlines into placeholder text, either by using yaml's [multiline strings](http://stackoverflow.com/questions/3790454/in-yaml-how-do-i-break-a-string-over-multiple-lines) or by adding `\n`, e.g. `text: ARTICLE BODY\n\nClick to add #content`
* Placeholder height should reflect how the component will look when data is added to the field. A single line of text will be short, while a component list will probably be taller.
* Placeholder height is a string, so you may specify different units if applicable.
* Placeholders are specified in the component schema, so all instances of that component will have the same placeholder text, height, and logic.

### Groups

In most inline forms, you'll want to edit a single field (e.g. when editing a paragraph). In most overlay forms, though, you'll want multiple fields. This is where groups come in.

Groups can be used to open forms with multiple fields in both inline and overlay forms, or when you want to guarantee the order of fields in your component settings form.

#### Creating a Group

In the root of your schema.yml, add a `_groups` object that contains a `fields` array.

```yaml
title:
  _has: text
url:
  _has: text

_groups:
  myGroup:
    fields:
      - title
      - url
```

If an element in your template points to that group, clicking it will create a form with all of that group's fields.

```html
<div data-editable="myGroup"></div>
```

You can add field properties to groups, which will work the same way as with fields. Groups can be displayed `inline` as well as in an `overlay`.

```yaml
_groups:
  inlineStuff:
    fields:
      - title
      - url
    _label: Inline Stuff
    _display: inline
```

When Kiln generates a form for a group, the `_display` (and `_placeholder`) properties of the individual fields are ignored. This means that you don't have to specify those properties in your fields if they're only used in groups (rather than referenced directly).

If you add a `_placeholder` to a group, you _must_ either make it permanent (with `permanent: true`) _or_ specify fields it should check (with `ifEmpty: fieldName`). It will display the placeholder when that field is empty.

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

Placeholders may check two different fields with a logical operator. This is handy for components with editable links, as you'll usually want to display a placeholder when _either_ the url or the link text are empty. Operators are case-insensitive, and you can use `AND`, `OR`, or `XOR`.

```yaml
_groups:
  link:
    fields:
      - url
      - text
    _placeholder:
      ifEmpty: url OR text
```

#### Settings Group

By default, Kiln will look through your fields to generate the component settings form. It will add any field with `_display: settings` to the form, but (because schemae are objects) there's no guarantee that the fields' order in the schema will be their order in the form.

If you want to guarantee the field order in your component settings form, you can create the `settings` group manually. This will override the default logic, so remember to add all of the fields you want to have in your settings form.

```yaml
_groups:
  settings:
    fields:
      - title
      - url
```

You don't need to specify `_label` (the form will be called "<Component Name> Settings"), `_display`, or `_placeholder` for the `settings` group. If you use it, you also don't need to specify `_display: settings` inside the individual fields.

# Component Description

Every Clay component has a `README.md` which is automatically generated from that component's schema. Each schema can (and should) have a root-level `_description` property which contains markdown-formatted text describing the purpose and use of the component. Descriptions look like this:

```yaml
_description: |
  A short description of the component.

  A more detailed overview of functionality and business use cases, intended
  for an audience of devs, designers, and product managers. It may include:

  * lists of workflows, functional requirements, business justifications
  * plain english descriptions of any non-obvious functionality
  * intentions of the author and situations that are explicitly unsupported
```

## Field Descriptions

When defining fields in a component's schema, it's usually useful to add descriptions explaining what kinds of data should live in the field and how it's used. These descriptions will be displayed when the form opens, _and will be used when generating a component's readme._

```yaml
fieldName:
  _label: Field Label
  _has:
    - text
    -
      fn: description
      value: This is the description of the field. <em>You can add html tags.</em> It will display in the form and in the component readme.
```

# Writing Behaviors

When a form is created (by clicking an element with `data-editable`, or by clicking into component settings), fields are added and each field's behavior is called in the order they're defined. The function signature for an individual behavior has two arguments, `result` and `args`.

```js
module.exports = function (result, args) {
  /*
   * behaviors have a lot of flexibility!
   * They can append elements to the field,
   * set up data binding with complicated logic,
   * add event handlers for clicking, typing, and swiping,
   * implement WYSIWYG libraries like medium-editor and Prosemirror,
   * and much, much more!
   */

  return result; // pass it on
};
```

## Result

The `result` argument contains the field's name, element, data bindings, formatters, and binders.

* **name:** The name of the field, taken directly from the schema
* **el:** The field's element. Behaviors can progressively append elements to this as they're run
* **bindings:** Data bindings for the field, containing `name`, `label`, and `data`. You can add more data and functions here, based on behavior logic. When all fields are added to the form, rivets will recieve a `bindings` object with properties for each field (using the field's `name`), e.g. `{ field1: { bindings }, field2: { bindings } }`
* **formatters:** [Rivets formatters](http://rivetsjs.com/docs/guide/#formatters) are singletons that are added at the form level
* **binders:** [Rivets binders](http://rivetsjs.com/docs/guide/#binders) are singletons that are added at the form level

Behaviors should return the first argument passed in (the `result` object), but may return a promise that resolves to that object. This is useful if your behavior needs to make api calls or do other async things.

```js
module.exports = function (result, args) {
  return fetch(args.url)
    .then(function (res)) {
      result.el = res;
      return result;
    });
};
```

## Args

The `arg` argument contains all arguments from the schema.

```yaml
fn: text
type: url
placeholder: http://domain.com
```

These arguments will be passed through to your behavior.

```js
module.exports = function (result, args) {
  console.log(args.type) // => 'url'
  console.log(args.placeholder) // => 'http://domain.com'
  return result;
};
```

### Best Practices for Behavior Args

It's best practice to write a JSDoc comment at the top of your `module.exports` function describing the arguments it accepts. This acts as a sort of API documentation for developers writing schemae against this behavior.

```js
/**
 * A short description of your behavior
 * @param {object}  result
 * @param {{}} args defined in detail below:
 * @param {type}  args.foo   if your argument is required
 * @param {type} [args.bar]  if your argument is optional
 * @returns {object}
 */
module.exports = function (result, args) {
  // do stuff with those args
  return result;
};
```
