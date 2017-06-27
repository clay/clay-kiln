
# text

Autocomplete

# text

Autocomplete

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

# conditional-required

Appends "required (field name)" to a field's label, to mark that field as required (based on another field).

## Arguments

* **field** to compare against
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

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story`

# description

Appends a description to a field.

## Arguments

* **value** _(required)_ field description, allows html

# drop-image

Appends dragdrop events to an input which grab the url of any file dropped into the input.

## Arguments

_No arguments_

# label

Appends a label to a field. This is pulled from the field's `_label` property, and falls back to using the key of the field.

## Arguments

_No arguments_

# lock

Append a lock button to an input. The input will be locked until the user clicks the lock button. This provides a small amount of friction before editing important (and rarely-edited) fields, similar to macOS's system preferences.

# magic-button

Append a magic button to an input.

## Arguments

* **field** _(optional)_ a field to grab the value from
* **component** _(optional)_ a name of a component to grab the component ref from
* **transform** _(optional)_ a transform to apply to the grabbed value
* **transformArg** _(optional)_ an argument to pass through to the transform
* **store** _(optional)_ to grab data from the client-side store
* **url** _(optional)_ to get data from
* **property** _(optional)_ to get from the returned data
* **moreMagic** _(optional)_ to run the returned value through more transforms, api calls, etc

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

Magic buttons are extremely powerful, but can be a little confusing to configure. This is what they generally look like:

1. specify a `field` or `component`. The button will grab the value or ref, respectively
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
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"

```yaml
field: url
transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
url: [mediaplay api url]
property: metadata.caption
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"

```yaml
component: mediaplay-image
store: components
property: url
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a list of items keyed by some component uri"

```yaml
component: mediaplay-image
transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
url: $SITE_PREFIX/lists/images (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
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
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the tv show name and use it to automatically format an image url"

```yaml
field: showName
transform: formatUrl
transformArg: [base image url]/recaps-$DATAFIELD.png ($DATAFIELD is the placeholder in our formatUrl transform)
```

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

# radio

A group of radio buttons, allowing the user to select one of a few related options.

## Arguments

* **options** _(required)_ an array of strings

Unlike [checkbox-group](https://github.com/nymag/clay-kiln/blob/master/behaviors/checkbox-group.md), each option should be a string rather than an object. The label for each option will simply be the option converted to Start Case.

```yaml
field1:
  _has:
    fn: radio
    options:
      - foo # looks like Foo
      - bar # looks like Bar
      - baz # looks like Baz
```

# required

Appends "required" to a field's label, to mark that field as required.

## Arguments

_No arguments_

# reveal

Conditionally shows/hides a field based on another field

## Arguments

* **field** to compare against
* **operator** _(optional)_ to use for the comparison
* **value** _(optional)_ to compare the field against

If neither `operator` nor `value` are specified, this will show the current field if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

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

_Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story`

# segmented-button

A group of buttons allowing the user to select one of a few related options. Functions like a styled radio button.

## Arguments

* **options** _(required)_ an array of options

Each option should be an object with `icon`, `text`, and `value` properties. If `icon`s are provided the buttons will use those rather than the text.

_Note:_ It's best to choose either icons or text for all segments of the button, rather than interspersing them.

# segmented-button-group

A group of segmented buttons allowing the user to select one of a few related options. Functions like styled radio buttons.

## Arguments

* **options** _(required)_ an array of options

Each option should be an object with `title` and `values` properties. The `values` should be an array of objects with `icon`, `text`, and `value` properties. Like `segmented-button`, if `icon`s are provided the buttons will use those rather than the text.

_Note:_ It's best to choose either icons or text for all segments of the button, rather than interspersing them.

# select

A standard browser `<select>` element, allowing the user to select one of a few related options.

_Notes:_

- the first item in `options` is pre-selected
- you can force the user to select an option by adding a `required` behavior and by setting the options like this:

```yaml
    fn: select
    options:
      -
      - foo
      - bar
```

Since a blank option is selected by default, the validator will fail.

## Arguments

* **options** _(required)_ an array of strings

Unlike [checkbox-group](https://github.com/nymag/clay-kiln/blob/master/behaviors/checkbox-group.md), each option should be a string rather than an object. The label for each option will simply be the option converted to Start Case.

```yaml
field1:
  _has:
    fn: select
    options:
      - foo # looks like Foo
      - bar # looks like Bar
      - baz # looks like Baz
```

# simple-list-item

A component which represents a single item in the `simple-list` component. Functionality is derived from its parent.

# simple-list

An array of objects with a `text` property that is a string to display in a list. Useful for tags, authors, keywords, etc.

## Arguments

* **allowRepeatedItems** _(optional)_ allow the same item more than once. defaults to false

* **autocomplete** _(optional)_ object with autocomplete options. Currently this is just the key `list` where the value is the name of a list that Amphora knows about accessible via `/<site>/lists/<listName>`. Example:

```yaml
  -
    fn: simple-list
    autocomplete:
      list: authors
```

* **propertyName** _(optional)_ appends double-click functionality to items in the list. Name of the property that is considered "primary"

* **badge** _(optional)_ string to put in the badge if `propertyName` is defined. Defaults to property name

## Usage

* Items may be added by clicking into the input, typing stuff, then pressing <kbd>enter</kbd>, <kbd>tab</kbd>, or <kbd>,</kbd> (comma).
* Items may be deleted by selecting them (either by clicking them or navigating with the <kbd>→</kbd> and <kbd>←</kbd> then hitting <kbd>delete</kbd> or <kbd>backspace</kbd>.
* Hitting <kbd>delete</kbd>, <kbd>backspace</kbd>, or <kbd>←</kbd> in the input will select the last item if the input is empty.
* If `propertyName` is defined it will allow users to double-click items in a simple-list to select a "primary" item. It will also append a small badge to the "primary" item. Only one item may be "primary" at a time.

# site-specific-select

A standard browser `<select>` element, allowing the user to select one of a few related options. Options are delineated by site, using the site slug.

## Arguments

* **sites** _(required)_ an array of site options
* **default** _(optional)_ an array of default options

Each site should have a `slug` to match and an `options` array. Similar to the [select behavior](https://github.com/nymag/clay-kiln/blob/master/behaviors/select.md), options are an array of strings. The label for each option will simply be the option converted to Start Case.

```yaml
field1:
  _has:
    fn: site-specific-select
    sites:
      -
        slug: site1
        options:
          - foo # looks like Foo
          - bar # looks like Bar
          - baz # looks like Baz
      -
        slug: site2
        options:
          - quz
          - quuz
```

You may also specify `default` options that will be used if no site slug matches.

```yaml
field1:
  _has:
    fn: site-specific-select
    sites:
      -
        slug: site1
        options:
          - foo # looks like Foo
          - bar # looks like Bar
          - baz # looks like Baz
    default:
      - quz
      - quuz
```

# soft-maxlength

Appends a character count to an input. Allows the user to type above the limit, but can be paired with publishing validation to prevent publishing things that are too long.

## Arguments

* **value** _(required)_ number of characters that should be allowed

The character count will update as users type into the input, and will turn red if they type more characters than allowed.

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

# textarea

A multi-line text input.

## Arguments

* **required** _(optional)_ set textarea required (will block saving)
* **placeholder** _(optional)_ placeholder that will display in the textarea

# wysiwyg

A multi-line text input which allows a rich editing experience. Uses [Quill](http://quilljs.com/).

## Arguments

* **buttons** _(optional)_  array of button names (strings) or groups (arrays) for text styling, passed directly into Quill (defaults to "remove formatting")
* **styled** _(optional)_   style the content editable element like our `text` and `textarea` inputs.
* **type** _(optional)_ `single-line`, `multi-line`, or `multi-component`. (defaults to `single-line`)
* **pseudoBullet** _(optional)_ boolean to enable <kbd>tab</kbd> to create pseudo bullet points
* **paste** _(optional)_ array of paste rules for parsing pasted content and creating new components

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
  _display: inline
  _has:
    -
      fn: wysiwyg
      type: 'multi-component'
      pseudoBullet: true
      styled: false
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
