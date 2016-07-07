# checkbox-group

A group of checkboxes, allowing the user to toggle on or off related items.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **options** _(required)_ an array of checkboxes

Each option should be an object with `name` and `value` properties. Use the bootstrap to specify which should be toggled by default, e.g.

```yaml
field1:
  option1: true
  option2: false
  option3: false
```
