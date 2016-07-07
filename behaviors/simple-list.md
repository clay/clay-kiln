# simple-list

A simple list of strings. Useful for tags, authors, keywords, etc.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **allowRepeatedItems** _(optional)_ allow the same item more than once. defaults to false

## Usage

* Items may be added by clicking into the input, typing stuff, then pressing <kbd>enter</kbd>, <kbd>tab</kbd>, or <kbd>,</kbd> (comma).
* Items may be deleted by selecting them (either by clicking them or navigating with the <kbd>→</kbd> and <kbd>←</kbd>/<kbd>tab</kbd> and <kbd>shift+tab</kbd> keys) then hitting <kbd>delete</kbd> or <kbd>backspace</kbd>.
* Hitting <kbd>delete</kbd>, <kbd>backspace</kbd>, or <kbd>←</kbd> in the input will select the last item if the input is empty.

_Note:_ Behaviors like [simple-list-primary](https://github.com/nymag/clay-kiln/blob/master/behaviors/simple-list-primary.md) and [autocomplete](https://github.com/nymag/clay-kiln/blob/master/behaviors/autocomplete.md) work very well with simple-list. Try them out!
