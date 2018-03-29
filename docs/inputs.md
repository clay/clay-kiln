
# `checkbox-group`

A group of checkboxes, allowing the user to toggle on or off related items. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components). [Uses Keen's UICheckboxGroup](https://josephuspaye.github.io/Keen-UI/#/ui-checkbox-group).

```yaml
    input: checkbox-group
    options:
      - foo (site1)
      - bar (not: site1)
      - baz (site1, site2)
```

### Checkbox Group Arguments

* **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)
* **help** - description / helper text for the field
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.requiredMessage** - will appear when required validation fails

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

# `checkbox`

A single checkbox, allowing the user to toggle something on or off. [Uses Keen's UICheckbox](https://josephuspaye.github.io/Keen-UI/#/ui-checkbox).

In practice, it's usually best to use a conversational tone / question as the checkbox label, e.g.

```yaml
field1:
  _label: Should we use a special logo in this component?
  _has: checkbox
```

### Checkbox Arguments

* **help** - description / helper text for the field

> #### info::Note
>
> Single checkboxes don't have validation.

# `codemirror`

A syntax-highlighted text area. Useful for writing css, sass, yaml, or other code in the editor.

### Codemirror Arguments

* **mode** _(required)_ the language used
* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.requiredMessage** - will appear when required validation fails

The mode of the editor sets syntax highlighting, linting, and other functionality. Currently, we support these modes:

* `text/css` - css mode
* `text/x-scss` - sass/scss mode (useful for per-instance styles)
* `text/x-yaml` - yaml mode (useful for writing elasticsearch queries)

> #### info::Note
>
> We will add more supported modes as we find use cases for them. See [the full list of modes supported in codemirror.](http://codemirror.net/mode/)

# `complex-list`

An array of objects with arbitrary properties. Each property may have any inputs a field is allowed to have, including custom inputs. Complex-list is similar to [Angular's _transcluded directives_](https://nulogy.com/who-we-are/company-blog/articles/transclusion-in-angular/) or [Advanced Custom Fields' _repeater field_](https://www.advancedcustomfields.com/add-ons/repeater-field/), in that each item in the list is treated like a separate field. Like fields, items must also have `_label`, but may not have `_placeholder`.

### Complex List Arguments

* **props** an array of objects, represending the fields in each item. Each item should have a name, defined by `prop: 'name'`, as well as `_label` and the input that item uses.

### Complex List Usage

* When a complex-list is empty, it will display a `add` button to add the initial item
* Items can be added by clicking the `add` button
* When a complex-list is _not_ empty, the focused item will have actions it, with `add` and `remove` buttons
* Items can be removed by clicking the `remove` button
* Items in a complex-list cannot be reordered, but can be added and removed from anywhere in the list.

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

> #### info::Note
>
> Complex lists don't have any of the common shared arguments, and don't display a field label.

# `csv`

A button that allows uploading CSV data. Note: the data isn't editable once it's uploaded, but should be re-uploaded from a CSV file when it needs to be changed.

### CSV Arguments

* **delimiter** - alternate delimiter (defaults to comma, of course)
* **quote** - alternate quote to use (defaults to one double-quote)
* **help** - description / helper text for the field

Note: Certain spreadsheet editors like Google Spreadsheets will use triple-quotes if you use both quotes and commas in your cells. Make sure you account for that by changing the `quote` argument:

```yaml
_has:
  input: csv
  quote: '"""'
```

> #### info::Note
>
> CSV buttons don't have validation or attached buttons.

# `datepicker`

A material design calendar picker. Allows specifying minimim and maximum dates. [Uses Keen's UIDatepicker](https://josephuspaye.github.io/Keen-UI/#/ui-datepicker).

### Datepicker Arguments

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.min** - minimum date, specified in YYYY-MM-DD
* **validate.max** - maximum date, specified in YYYY-MM-DD
* **validate.requiredMessage** - will appear when required validation fails
* **validate.minMessage** - will appear when minimum validation fails
* **validate.maxMessage** - will appear when maximum validation fails

# `wysiwyg`

A multi-line text input which allows a rich editing experience. Uses [Quill](http://quilljs.com/). Inline inputs (which can only be wysiwyg) have the same arguments as normal wysiwyg, but will inherit styles from their parent component.

### WYSIWYG Arguments

* **buttons** - array of button names (strings) or groups (arrays) for text styling, passed directly into Quill (defaults to "remove formatting")
* **type** - `single-line`, `multi-line`, or `multi-component`. (defaults to `single-line`)
* **pseudoBullet** - boolean to enable <kbd>tab</kbd> to create pseudo bullet points
* **paste** - array of paste rules for parsing pasted content and creating new components
* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.min** - minimum length that the field must meet
* **validate.max** - maximum length that the field must not exceed
* **validate.pattern** - regex pattern
* **validate.requiredMessage** - will appear when required validation fails
* **validate.minMessage** - will appear when minimum validation fails
* **validate.maxMessage** - will appear when maximum validation fails
* **validate.patternMessage** - will appear when pattern validation fails (very handy to set, as the default message is vague)

The buttons allowed in our wysiwyg behavior are [defined in Quill's documentation](http://quilljs.com/docs/modules/toolbar/)

The default `type` -- `single-line` -- allows entering one line of rich text, but prevents users from creating new paragraphs or applying paste rules.

`multi-line` is used for components like blockquotes or lists, and allows paste rules to create new block-level elements in the same component's field (but not create different components).

`multi-component` (which is usually used when the input is `inline`, but may be used in normal `wysiwyg` inputs) enables more affordances, including:

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

```
paste:
  - match: (https?://twitter\.com/\w+?/status/\d+)
    matchLink: true
    component: clay-tweet
    field: url
  - match: (https?://www\.facebook\.com/.+?/posts/\d+)
    matchLink: true
    component: clay-facebook-post
    field: url
    group: inlineForm
  - match: <blockquote>(.*?)(?:</blockquote>)?
    component: blockquote
    field: text
  - match: (.*)
    component: clay-paragraph
    field: text
```

# `inline`

A multi-line text input which allows a rich editing experience, but appears inline rather than in a form. It will inherit styles from the component you're editing, rather than looking like a Kiln text input. [It supports exactly the same arguments as `wysiwyg`.](inputs.md#wysiwyg)

# `lock`

Appends a lock button to an input. The input will be locked until the user clicks the lock button. This provides a small amount of friction before editing important (and rarely-edited) fields, similar to macOS's system preferences.

# `magic-button`

Append a magic button to an input.

### Magic Button Arguments

* **field** - a field to grab the value from (in the current complex list, form, or component)
* **component** - a name of a component to grab the component ref/uri from
* **transform** - a transform to apply to the grabbed value
* **transformArg** - an argument to pass through to the transform
* **store** - to grab data from the client-side store
* **url** - to get data from
* **property** - to get from the returned data
* **moreMagic** - to run the returned value through more transforms, api calls, etc
* **tooltip** - text that will display in a tooltip. used to explain what each button is doing, so make it concise!

### Magic Button Usage

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

Magic buttons are extremely powerful, but can be a little confusing to configure. This is what they generally look like:

1. specify a `field` or `component`. The button will grab the value or ref, respectively. If you specify either as an array, it will look for the first field/component, then fall back to the next ones specified in the array if necessary (if the field is empty, or the component isn't on the page)
2. specify a `transform`. Transforms are useful when doing api calls with that data
2. specify a `transformArg` if you need to send more information to the transform.
3. specify a `store` path or `url` if you need to grab data from somewhere. The request will be prefixed with the `store`/`url` string you pass in.
4. specify a `property` to grab from the result of that api call. You can use `_.get()` syntax, e.g. `foo.bar[0].baz`. If you specify as an array, it will grab the first property in the array that's not empty in the component above.
5. add `moreMagic` if you need to do anything else to the returned data

**All of these arguments are optional!**

#### Here are some examples:

_Note: MediaPlay is the name of our image server._

##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "just grab the primary headline"

```yaml
field: primaryHeadline
tooltip: Use Primary Headline
```

##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"

```yaml
field: url
transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
url: [mediaplay api url]
property: metadata.caption
tooltip: Fetch caption from Mediaplay
```

##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"

```yaml
component: mediaplay-image
store: components
property: url
tooltip: Fetch First Image
```

##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a list of items keyed by some component uri"

```yaml
component: mediaplay-image
transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
url: $SITE_PREFIX/_lists/images (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
tooltip: Fetch Images
```

##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the image url from a lede component, then ask mediaplay for the caption"

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

##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the tv show name and use it to automatically format an image url"

```yaml
field: showName
transform: formatUrl
transformArg: [base image url]/recaps-$DATAFIELD.png ($DATAFIELD is the placeholder in our formatUrl transform)
tooltip: Fetch TV Show Image
```
##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab an image url from either a mediaplay-image (url) or lede-gallery (ledeImageUrl) (whichever is higher on the page)"

```yaml
component: 
  - mediaplay-image
  - lede-gallery
store: components
property: 
  - url
  - ledeImageUrl
tooltip: Fetch First Image
```

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

# `radio`

A group of radio buttons, allowing the user to select one of a few related options. You can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components). [Uses Keen's UIRadioGroup](https://josephuspaye.github.io/Keen-UI/#/ui-radio-group).

```yaml
    input: radio
    options:
      - foo (site1)
      - bar (not: site1)
      - baz (site1, site2)
```

### Radio Arguments

* **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)
* **help** - description / helper text for the field
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.requiredMessage** - will appear when required validation fails

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

# `segmented-button`

A group of buttons allowing the user to select one (or more!) of a few related options.

### Segmented Button Arguments

* **multiple** - allow multiple things to be selected. `false` by default
* **options** - an array of options
* **help** - description / helper text for the field
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.requiredMessage** - will appear when required validation fails

Each option should be an object with `icon`, `text`, and `value` properties. Icons will be displayed in the buttons, and text will be used for tooltips.

> #### info::Data Format
>
> By default, the data for this field will be the selected option's `value`. If multiple selection is turned on, it'll be an object with boolean values keyed to each option's `value`, similar to `checkbox-group`.

# `segmented-button-group`

A group of segmented buttons allowing the user to select one (or more!) of a few related options.

### Segmented Button Group Arguments

* **multiple** - allow multiple things to be selected. `false` by default
* **options** _(required)_ an array of options
* **help** - description / helper text for the field
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.requiredMessage** - will appear when required validation fails

Each option should be an object with `title` and `values` properties. The `values` should be an array of objects with `icon`, `text`, and `value` properties, which will be passed into each `segmented-button`.

> #### info::Data Format
>
> By default, the data for this field will be the selected option's `value`. If multiple selection is turned on, it'll be an object with boolean values keyed to each option's `value`, similar to `checkbox-group`.

# `select`

An enhanced browser `<select>` element, allowing the user to select one (or more!) of a few related options. [Uses Keen's UISelect](https://josephuspaye.github.io/Keen-UI/#/ui-select).

### Select Arguments

* **multiple** - allow multiple options to be selected. data will be an object with options as keys, similar to checkbox-group
* **search** - allow users to type stuff in to filter options. Extremely useful for longer options lists
* **list** - The key `list` is where the value is the name of a list that Amphora knows about accessible via `/<site>/_lists/<listName>`.
* **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)
* **keys** passthrough option for Keen to specify keys for input objects, especially for use when you don't control the input shape, e.g. lists. Defaults to `{label: 'name', value: 'value'}`
* **storeRawData** normally only the `value` of each option is stored, but with this option you can store the entire input object
* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.requiredMessage** - will appear when required validation fails

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

> #### info::Usage Notes
>
> * no/empty option is pre-selected by default (you don't need to specify an empty option in the schema)
> * you can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)
>
> ```yaml
>     fn: select
>     options:
>       - foo (site1)
>       - bar (not: site1)
>       - baz (site1, site2)
> ```

# `simple-list`

An array of strings (or objects with a `text` property, if you add the `propertyName` argument). Useful for lists of items such as tags, keywords, or author names.

### Simple List Arguments

* **propertyName** - appends double-click functionality to items in the list. The data will be an array of objects with `text` properties, as well as the value of this argument. e.g. `propertyName: bar` will make the data look like `[{ text: 'foo', bar: 'baz' }]`
* **badge** - name of the icon (or a two-character string) that should be displayed in the simple list item when editing. Icon names can be anything from the [Material Design Icon Set](https://material.io/icons/), or you can use two initials
* **allowRepeatedItems** - allow the same item more than once. defaults to false
* **autocomplete** - object with autocomplete options. The key `list`  is where the value is the name of a list that Amphora knows about accessible via `/<site>/_lists/<listName>`. The key `allowRemove` enables an X in the `autocomplete` that allows the user to remove that item from the autocomplete list. If the key `allowCreate` is set to true, Kiln will add the item to the list via the store.
* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.max** - maximum number of items that the field must not exceed
* **validate.requiredMessage** - will appear when required validation fails
* **validate.maxMessage** - will appear when maximum validation fails

```yaml
  -
    fn: simple-list
    autocomplete:
      list: authors
```

### Simple List Usage

* Type something and press <kbd>enter</kbd>, <kbd>tab</kbd>, or <kbd>,</kbd> (comma) to add it as an item
* Delete items by clicking the `x` button or selecting them and pressing <kbd>backspace</kbd>
* Select items using <kbd>→</kbd> / <kbd>←</kbd> or <kbd>tab</kbd> and <kbd>shift + tab</kbd>. You may select the last item in the list from the text input
* Pressing <kbd>backspace</kbd> in an empty text input will select the last item in the list
* If `propertyName` is defined, you can double-click items to set the "primary" item. This will add a badge to the primary item. Only one item may be "primary" at a time
* Double-clikcing the "primary" item will unset it as the "primary" item

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

# `text`

A basic text input. Can be single line or multi-line. Uses the float label pattern. [Uses Keen's UITextbox](https://josephuspaye.github.io/Keen-UI/#/ui-textbox).

### Text Arguments

* **type** - input type, which can match any native `<input type="">` or can be set to `multi-line` for a multi-line text area
* **rows** - number of lines the textarea should have. to be used with `multi-line`
* **step** - define step increments (for numberical inputs only)
* **enforceMaxlength** - prevent user from typing more characters than the maximum allowed (`from validate.max`)
* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.min** - minimum number (for `type=numer`) or length (for other types) that the field must meet
* **validate.max** - maximum number (for `type=number`) or length (for other types) that the field must not exceed
* **validate.pattern** - regex pattern
* **validate.requiredMessage** - will appear when required validation fails
* **validate.minMessage** - will appear when minimum validation fails
* **validate.maxMessage** - will appear when maximum validation fails
* **validate.patternMessage** - will appear when pattern validation fails (very handy to set, as the default message is vague)

# `timepicker`

A basic time picker. Uses native time inputs when available, but falls back to relatively-simple natural language parsing.

### Timepicker Arguments

* **help** - description / helper text for the field
* **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
* **validate.required** - either `true` or an object that described the conditions that should make this field required
* **validate.requiredMessage** - will appear when required validation fails

> #### info::Natural Language Parsing
>
> On browsers without native time pickers, users may enter in the time without worrying about the format. The simple NLP engine can handle things like "10am", "4:15 PM", "13:00", and even "midnight".
