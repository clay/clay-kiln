# checkbox-group

A single checkbox, allowing the user to toggle something on or off.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **label** _(required)_ the checkbox label

In practice, it's usually best to use a conversational tone / question as the checkbox label, with the field label being shorter. e.g.

```yaml
field1:
  _label: Special Logo
  _has:
    fn: checkbox
    label: Should we use a special logo in this component?
```
