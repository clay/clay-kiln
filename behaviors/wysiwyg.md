# wysiwyg

A multi-line text input which allows a rich editing experience. Uses [medium-editor](https://github.com/yabwe/medium-editor).

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **required** _(optional)_ set textarea required (will block saving)
* **placeholder** _(optional)_ placeholder that will display in the textarea


* **buttons** _(optional)_  array of button names (strings) for text styling. defaults to "remove formatting"
* **styled** _(optional)_   style the content editable element like our `text` and `textarea` inputs.
* **enableKeyboardExtras** _(optional)_  enable creating new components on enter, and appending text to previous components on delete, etc

The buttons allowed in our wysiwyg behavior are:

* bold
* italic
* strikethrough
* anchor

By default, wysiwyg fields will use the styles of the containing component. To use our kiln input styling, set `styled` to `true`.

**Keyboard Extras** are the difference between a simple wysiwyg field and a robust content authoring experience. When enabled, these features are unlocked:

* hitting enter will create a new instance of the component you're in, add it onto the page, and paste in text if there is text _in front of_ your cursor
* hitting delete (with the cursor at the beginning of the input) will remove the component you're in and paste text into the previous instance of the same component if there is text _in front of your cursor_
* hitting <kbd>tab</kbd> will insert a bullet point
* hitting <kbd>shift+enter</kbd> will insert a soft break

_Note:_ All pasted text gets run through [text-model](https://github.com/nymag/text-model). Pasting in multiple paragraphs will create multiple instances of the current component with the respective paragraphs of text added to each instance.
