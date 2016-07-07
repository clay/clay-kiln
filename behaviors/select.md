# select

A standard browser `<select>` element, allowing the user to select one of a few related options.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

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
