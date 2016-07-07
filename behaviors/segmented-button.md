# segmented-button

A group of buttons allowing the user to select one of a few related options. Functions like a styled radio button.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **options** _(required)_ an array of options

Each option should be an object with `icon`, `text`, and `value` properties. If `icon`s are provided the buttons will use those rather than the text.

_Note:_ It's best to choose either icons or text for all segments of the button, rather than interspersing them.
