
# autocomplete-item

Individual autocomplete item, used by `autocomplete` (which is itself used by `simple-list`).

# autocomplete

Autocomplete for `simple-list`.

# checkbox-group

A group of checkboxes, allowing the user to toggle on or off related items. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)

```yaml
    input: checkbox-group
    options:
      - foo (site1)
      - bar (not: site1)
      - baz (site1, site2)
```

## Arguments

* **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)

If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use `_reveal` on the field to conditionally hide/show it based on site.

```yaml
field1:
  _has:
    input: checkbox-group
    options:
      - foo
      -
        name: Bar
        value: bar
      -
        name: Baz Qux
        value: baz-qux
        sites: site1, site2
```

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# checkbox

A single checkbox, allowing the user to toggle something on or off.

In practice, it's usually best to use a conversational tone / question as the checkbox label, e.g.

```yaml
field1:
  _label: Should we use a special logo in this component?
  _has: checkbox
```

Note: Single checkboxes don't have validation, but may have help text below them.

# codemirror

A syntax-highlighted text area. Useful for writing css, sass, yaml, or other code in the editor.

## Arguments

* **mode** _(required)_ the language used

The mode of the editor sets syntax highlighting, linting, and other functionality. Currently, we support these modes:

* `text/css` - css mode
* `text/x-scss` - sass/scss mode (useful for per-instance styles)
* `text/x-yaml` - yaml mode (useful for writing elasticsearch queries)

_Note:_ We will add more supported modes as we find use cases for them. See [this link](http://codemirror.net/mode/) for the full list of modes supported in codemirror.

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# complex-list-item

A component which represents a single item in the `complex-list` input. Functionality is derived from its parent. Behaves similar to a field, as it transcludes other inputs via the same mechanism that field uses.

# complex-list

An array of objects with arbitrary properties. Each property may have any inputs a field is allowed to have, including custom inputs. Complex-list is similar to [Angular's _transcluded directives_](https://nulogy.com/who-we-are/company-blog/articles/transclusion-in-angular/) or [Advanced Custom Fields' _repeater field_](https://www.advancedcustomfields.com/add-ons/repeater-field/), in that each item in the list is treated like a separate field. Like fields, items must also have `_label`, but may not have `_placeholder`.

## Arguments

* **props** an array of objects, represending the fields in each item. Each item should have a name, defined by `prop: 'name'`, as well as `_label` and the input that item uses.

## Usage

* When a complex-list is empty, it will display a `add` button to add the initial item
* Items can be added by clicking the `add` button
* When a complex-list is _not_ empty, the focused item will have actions it, with `add` and `remove` buttons
* Items can be removed by clicking the `remove` button
* Items in a complex-list cannot be reordered, but can be added and removed from anywhere in the list.

## Example

```yaml
links:
  _has:
    input: complex-list
    props:
      -
        prop: url
        _label: URL
        _has:
          input: text
          type: url
      -
        prop: title
        _label: Title
        _has: text
```

# csv

A button that allows uploading csv data. Note: the data isn't editable once it's uploaded, but should be re-uploaded from a csv file when it needs to be changed.

## Arguments

* **delimiter** - alternate delimiter (defaults to comma, of course)
* **quote** - alternate quote to use (defaults to one double-quote)

Note: Certain spreadsheet editors like Google Spreadsheets will use triple-quotes if you use both quotes and commas in your cells. Make sure you account for that by changing the `quote` argument:

```yaml
_has:
  input: csv
  quote: '"""'
```

Note: CSV buttons don't have validation, but may have help text below them.

# datepicker

A material design calendar picker. Allows specifying minimim and maximum dates

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.min** - minimum date, specified in YYYY-MM-DD
* **validate.max** - maximum date, specified in YYYY-MM-DD

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails
* **validate.minMessage** - will appear when minimum validation fails
* **validate.maxMessage** - will appear when maximum validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# wysiwyg

A multi-line text input which allows a rich editing experience. Uses [Quill](http://quilljs.com/). Inline inputs (which can only be wysiwyg) have the same arguments as normal wysiwyg, but will inherit styles from their parent component.

## Arguments

* **buttons** - array of button names (strings) or groups (arrays) for text styling, passed directly into Quill (defaults to "remove formatting")
* **type** - `single-line`, `multi-line`, or `multi-component`. (defaults to `single-line`)
* **pseudoBullet** - boolean to enable <kbd>tab</kbd> to create pseudo bullet points
* **paste** - array of paste rules for parsing pasted content and creating new components

The buttons allowed in our wysiwyg behavior are [defined in Quill's documentation](http://quilljs.com/docs/modules/toolbar/)

By default, wysiwyg fields will use the styles of the containing component. To use our kiln input styling, set `styled` to `true`.

The default `type` -- `single-line` -- allows entering one line of rich text, but prevents users from creating new paragraphs or applying paste rules.

`multi-line` is used for components like blockquotes or lists, and allows paste rules to create new block-level elements in the same component's field (but not create different components).

`multi-component` enables more affordances, including:

* keyboard navigation across components (up and down arrows)
* <kbd>enter</kbd> creating new components (and splitting text in front of the cursor into them)
* <kbd>delete</kbd> removing components (and merging text in front of the cursor into the previous component)
* full paste rule affordances, including creating different components

**Paste** is an optional array of pasting rules that's used for parsing and creating different components. This is useful for transforming pasted links into embeds, catching pasted blockquotes, etc. Rules have these properties:

* `match` - regex to match the pasted content. all rules will be wrapped in `^` and `$` (so they don't match urls _inside_ links in the content)
* `matchLink` - boolean to determine whether _links_ containing the regex should also match. Should be true for embeds, false for components that could potentially contain links inside them.
* `component` - the name of the component that should be created
* `field` - the name of the field that the captured data should be populated to on the new component. the (last) new component will focus this field after it's added (note: this is limited to a single regex capture group)
* `group` - (optional) the group that should be focused when the (last) new component is added (instead of the specific field). this is useful for components with forms that contain both the specified field and other things, and preserves the same editing experience as editing that component normally

## Example

```
text:
  _placeholder:
    height: 50px
    text: New Paragraph
    required: true
  _has:
    input: inline
    type: 'multi-component'
    pseudoBullet: true
    buttons:
      - bold
      - italic
      - strike
      - link
      -
        script: sub
    paste:
      -
        match: (https?://twitter\.com/\w+?/status/\d+)
        matchLink: true
        component: clay-tweet
        field: url
      -
        match: (https?://www\.facebook\.com/.+?/posts/\d+)
        matchLink: true
        component: clay-facebook-post
        field: url
        group: inlineForm
      -
        match: <blockquote>(.*?)(?:</blockquote>)?
        component: blockquote
        field: text
      -
        match: (.*)
        component: clay-paragraph
        field: text
```

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.min** - minimum number (for `type=numer`) or length (for other types) that the field must meet
* **validate.max** - maximum number (for `type=number`) or length (for other types) that the field must not exceed
* **validate.pattern** - regex pattern

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails
* **validate.minMessage** - will appear when minimum validation fails
* **validate.maxMessage** - will appear when maximum validation fails
* **validate.patternMessage** - will appear when pattern validation fails (very handy to set, as the default message is vague)

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# lock

Append a lock button to an input. The input will be locked until the user clicks the lock button. This provides a small amount of friction before editing important (and rarely-edited) fields, similar to macOS's system preferences.

# magic-button

Append a magic button to an input.

## Arguments

* **field** - a field to grab the value from (in the current complex list, form, or component)
* **component** - a name of a component to grab the component ref/uri from
* **transform** - a transform to apply to the grabbed value
* **transformArg** - an argument to pass through to the transform
* **store** - to grab data from the client-side store
* **url** - to get data from
* **property** - to get from the returned data
* **moreMagic** - to run the returned value through more transforms, api calls, etc
* **tooltip** - text that will display in a tooltip. used to explain what each button is doing, so make it concise!

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

Magic buttons are extremely powerful, but can be a little confusing to configure. This is what they generally look like:

1. specify a `field` or `component`. The button will grab the value or ref, respectively. If you specify either as an array, it will look for the first field/component, then fall back to the next ones specified in the array if necessary (if the field is empty, or the component isn't on the page)
2. specify a `transform`. Transforms are useful when doing api calls with that data
2. specify a `transformArg` if you need to send more information to the transform.
3. specify a `store` path or `url` if you need to grab data from somewhere. The request will be prefixed with the `store`/`url` string you pass in.
4. specify a `property` to grab from the result of that api call. You can use `_.get()` syntax, e.g. `foo.bar[0].baz`
5. add `moreMagic` if you need to do anything else to the returned data

**All of these arguments are optional!**

## Here are some examples:

_Note: MediaPlay is the name of our image server._

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "just grab the primary headline"

```yaml
field: primaryHeadline
tooltip: Use Primary Headline
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"

```yaml
field: url
transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
url: [mediaplay api url]
property: metadata.caption
tooltip: Fetch caption from Mediaplay
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"

```yaml
component: mediaplay-image
store: components
property: url
tooltip: Fetch First Image
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a list of items keyed by some component uri"

```yaml
component: mediaplay-image
transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
url: $SITE_PREFIX/_lists/images (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
tooltip: Fetch Images
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the image url from a lede component, then ask mediaplay for the caption"

```yaml
component: feature-lede
store: components
property: imgUrl
moreMagic:
  -
    transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
    url: [mediaplay api url]
    property: metadata.caption
tooltip: Fetch Caption For Lede Image
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the tv show name and use it to automatically format an image url"

```yaml
field: showName
transform: formatUrl
transformArg: [base image url]/recaps-$DATAFIELD.png ($DATAFIELD is the placeholder in our formatUrl transform)
tooltip: Fetch TV Show Image
```

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

# radio

A group of radio buttons, allowing the user to select one of a few related options. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)

```yaml
    input: radio
    options:
      - foo (site1)
      - bar (not: site1)
      - baz (site1, site2)
```

## Arguments

* **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)

If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use `_reveal` on the field to conditionally hide/show it based on site.

```yaml
field1:
  _has:
    input: radio
    options:
      - foo
      -
        name: Bar
        value: bar
      -
        name: Baz Qux
        value: baz-qux
        sites: site1, site2
```

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# segmented-button

A group of buttons allowing the user to select one (or more!) of a few related options.

## Arguments

* **multiple** - allow multiple things to be selected. `false` by default
* **options** - an array of options

Each option should be an object with `icon`, `text`, and `value` properties. Icons will be displayed in the buttons, and text will be used for tooltips.

Note: By default, the data for this field will be the selected option's `value`. If multiple selection is turned on, it'll be an object with boolean values keyed to each option's `value`, similar to `checkbox-group`.

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# segmented-button-group

A group of segmented buttons allowing the user to select one (or more!) of a few related options.

## Arguments

* **multiple** - allow multiple things to be selected. `false` by default
* **options** _(required)_ an array of options

Each option should be an object with `title` and `values` properties. The `values` should be an array of objects with `icon`, `text`, and `value` properties, which will be passed into each `segmented-button`.

Note: By default, the data for this field will be the selected option's `value`. If multiple selection is turned on, it'll be an object with boolean values keyed to each option's `value`, similar to `checkbox-group`.

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# select

An enhanced browser `<select>` element, allowing the user to select one (or more!) of a few related options.

_Notes:_

- no/empty option is pre-selected by default (you don't need to specify an empty option in the schema)
- you can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)

```yaml
    fn: select
    options:
      - foo (site1)
      - bar (not: site1)
      - baz (site1, site2)
```

## Arguments

* **multiple** - allow multiple options to be selected. data will be an object with options as keys, similar to checkbox-group
* **search** - allow users to type stuff in to filter options. Extremely useful for longer options lists
* **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)

If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use `_reveal` on the field to conditionally hide/show it based on site.

```yaml
field1:
  _has:
    input: select
    options:
      - foo
      -
        name: Bar
        value: bar
      -
        name: Baz Qux
        value: baz-qux
        sites: site1, site2
```

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# simple-list-input

A component which represents the text input in the `simple-list` input. Functionality is derived from its parent.

# simple-list-item

A component which represents a single item in the `simple-list` input. Functionality is derived from its parent.

# simple-list

An array of strings (or objects with a `text` property, if you add the `propertyName` argument). Useful for lists of items such as tags, keywords, or author names.

## Arguments

* **propertyName** - appends double-click functionality to items in the list. The data will be an array of objects with `text` properties, as well as the value of this argument. e.g. `propertyName: bar` will make the data look like `[{ text: 'foo', bar: 'baz' }]`
* **badge** - name of the icon (or a two-character string) that should be displayed in the simple list item when editing. Icon names can be anything from the [Material Design Icon Set](https://material.io/icons/), or you can use two initials
* **allowRepeatedItems** - allow the same item more than once. defaults to false
* **autocomplete** - object with autocomplete options. Currently this is just the key `list` where the value is the name of a list that Amphora knows about accessible via `/<site>/_lists/<listName>`. Example:

```yaml
  -
    fn: simple-list
    autocomplete:
      list: authors
```

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.max** - maximum number of items that the field must not exceed

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails
* **validate.maxMessage** - will appear when maximum validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

## Usage

* Type something and press <kbd>enter</kbd>, <kbd>tab</kbd>, or <kbd>,</kbd> (comma) to add it as an item
* Delete items by clicking the `x` button or selecting them and pressing <kbd>backspace</kbd>
* Select items using <kbd>→</kbd> / <kbd>←</kbd> or <kbd>tab</kbd> and <kbd>shift + tab</kbd>. You may select the last item in the list from the text input
* Pressing <kbd>backspace</kbd> in an empty text input will select the last item in the list
* If `propertyName` is defined, you can double-click items to set the "primary" item. This will add a badge to the primary item. Only one item may be "primary" at a time
* Double-clikcing the "primary" item will unset it as the "primary" item

## Example

```yaml
tags:
  _label: Tags
  _has:
    input: simple-list
    propertyName: featureRubric
    badge: FR # or, say, `star` if you want to use a material design icon
    autocomplete:
      list: tags
```

# text

A basic text input. Can be single line or multi-line. Uses the float label pattern.

## Arguments

* **type** - defaults to `text` if not defined. Set to `multi-line` for a multi-line text area
* **step** - define step increments (for numberical inputs only)
* **enforceMaxlength** - prevent user from typing more characters than the maximum allowed (`from validate.max`)

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.min** - minimum number (for `type=numer`) or length (for other types) that the field must meet
* **validate.max** - maximum number (for `type=number`) or length (for other types) that the field must not exceed
* **validate.pattern** - regex pattern

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails
* **validate.minMessage** - will appear when minimum validation fails
* **validate.maxMessage** - will appear when maximum validation fails
* **validate.patternMessage** - will appear when pattern validation fails (very handy to set, as the default message is vague)

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.

# timepicker

A basic time picker. Uses native time inputs when available, but falls back to relatively-simple natural language parsing.

### Natural Language Parsing?

On browsers without native time pickers, users may enter in the time without worrying about the format. The simple NLP engine can handle things like "10am", "4:15 PM", "13:00", and even "midnight".

### Shared Arguments

This input shares certain arguments with other inputs:

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate** - an object that contains pre-publish validation rules:

* **validate.required** - either `true` or an object that described the conditions that should make this field required

Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

* **validate.requiredMessage** - will appear when required validation fails

### Conditional Required Arguments

* **field** to compare against (inside complex-list item, current form, or current component)
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

Operators:

* `===`
* `!==`
* `<`
* `>`
* `<=`
* `>=`
* `typeof`
* `regex`
* `empty` (only checks field data, no value needed)
* `not-empty` (only checks field data, no value needed)
* `truthy` (only checks field data, no value needed)
* `falsy` (only checks field data, no value needed)

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

Note: labels are pulled from the field's `_label` property.
