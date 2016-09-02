# select

A standard browser `<select>` element, allowing the user to select one of a few related options.

_Notes:_

- When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.
- the first item in `options` is pre-selected
- you can force the user to select an option by making the field `required` and by setting the options like this:

```yaml
    options:
      -  
      - foo
      - bar
```

since a blank option is selected by default, the validator will fail.
 
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
