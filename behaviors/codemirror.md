# codemirror

A syntax-highlighted text area. Useful for writing css, sass, yaml, or other code in the editor.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **mode** _(required)_ the language used

The mode of the editor sets syntax highlighting, linting, and other functionality. Currently, we support these modes:

* `text/css` - css mode
* `text/x-scss` - sass/scss mode (useful for per-instance styles)
* `text/x-yaml` - yaml mode (useful for writing elasticsearch queries)

_Note:_ We will add more supported modes as we find use cases for them. See [this link](http://codemirror.net/mode/) for the full list of modes supported in codemirror.
