
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

Note: labels are pulled from the field's `_label` property.
