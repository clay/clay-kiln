# wysiwyg

A multi-line text input which allows a rich editing experience. Uses [medium-editor](https://github.com/yabwe/medium-editor).

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **buttons** _(optional)_  array of button names (strings) or custom buttons (objects) for text styling. defaults to "remove formatting"
* **styled** _(optional)_   style the content editable element like our `text` and `textarea` inputs.
* **enableKeyboardExtras** _(optional)_  enable creating new components on enter, and appending text to previous components on delete, etc
* **paste** _(optional)_ array of paste rules for parsing pasted content and creating new components

The buttons allowed in our wysiwyg behavior are:

* bold
* italic
* strikethrough
* anchor
* phrase - uses [Medium Editor Phrase](https://github.com/nymag/medium-editor-phrase) and takes [documented options](https://github.com/nymag/medium-editor-phrase#initialization-options). See the example below for a full example.

By default, wysiwyg fields will use the styles of the containing component. To use our kiln input styling, set `styled` to `true`.

**Keyboard Extras** are the difference between a simple wysiwyg field and a robust content authoring experience. When enabled, these features are unlocked:

* hitting enter will create a new instance of the component you're in, add it onto the page, and paste in text if there is text _in front of_ your cursor
* hitting delete (with the cursor at the beginning of the input) will remove the component you're in and paste text into the previous instance of the same component if there is text _in front of your cursor_
* hitting <kbd>tab</kbd> will insert a bullet point
* hitting <kbd>shift+enter</kbd> will insert a soft break

_Note:_ All pasted text gets run through [text-model](https://github.com/nymag/text-model). Pasting in multiple paragraphs will create multiple instances of the current component with the respective paragraphs of text added to each instance.

**Paste** is an optional array of pasting rules that's used for parsing and creating different components. This is useful for transforming pasted links into embeds, catching pasted blockquotes, etc. Rules have these properties:

* `match` - regex to match the pasted content. all rules will be wrapped in `^` and `$` (so they don't match urls _inside_ links in the content), as well as `<a>` and `</a>` (so they do match links where the text itself is the url and the link is the only thing in a paragraph)
* `component` - the name of the component that should be created
* `field` - the name of the field that the captured data should be populated to on the new component. the (last) new component will focus this field after it's added (note: this is limited to a single regex capture group)
* `group` - (optional) the group that should be focused when the (last) new component is added (instead of the specific field). this is useful for components with forms that contain both the specified field and other things, and preserves the same editing experience as editing that component normally
* `sanitize` - (optional) a boolean flag that tells kiln whether the captured data should be run through text-model to sanitize it. this is useful for pasting into components' fields that themselves use the wysiwyg behavior (e.g. pasting a `<blockquote>` into a paragraph, which should create a new blockquote component with the sanitized text)

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
      enableKeyboardExtras: true
      styled: false
      buttons:
        - bold
        - italic
        - strikethrough
        - anchor
        - phrase:
            aria: annotate
            name: annotate
            contentDefault: A¹
            phraseClassList: ['clay-annotated'] # adds this class to the span
            phraseTagName: span
      paste:
        -
          match: (https?://twitter\.com/\w+?/status/\d+)
          component: clay-tweet
          field: url
        -
          match: (https?://www\.facebook\.com/.+?/posts/\d+)
          component: clay-facebook-post
          field: url
        -
          match: <blockquote>(.*?)(?:</blockquote>)?
          component: blockquote
          field: text
          sanitize: true
        -
          match: (.*)
          component: clay-paragraph
          field: text
          sanitize: true
```
