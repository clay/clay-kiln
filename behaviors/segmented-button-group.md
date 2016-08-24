# segmented-button-group

A group of segmented buttons allowing the user to select one of a few related options. Functions like styled radio buttons.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **options** _(required)_ an array of options

Each option should be an object with `title` and `values` properties. The `values` should be an array of objects with `icon`, `text`, and `value` properties. Like `segmented-button`, if `icon`s are provided the buttons will use those rather than the text.

_Note:_ It's best to choose either icons or text for all segments of the button, rather than interspersing them.
