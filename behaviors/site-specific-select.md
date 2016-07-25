# site-specific-select

A standard browser `<select>` element, allowing the user to select one of a few related options. Options are delineated by site, using the site slug.

_Note:_ When this behavior is added to a field, it will replace any previous elements (rather than modifying them). Add it as the first behavior.

## Arguments

* **sites** _(required)_ an array of site options

Each site should have a `slug` to match and an `options` array. Similar to the [select behavior](https://github.com/nymag/clay-kiln/blob/master/behaviors/select.md), options are an array of strings. The label for each option will simply be the option converted to Start Case.

```yaml
field1:
  _has:
    fn: site-specific-select
    sites:
      -
        slug: site1
        options:
          - foo # looks like Foo
          - bar # looks like Bar
          - baz # looks like Baz
      -
        slug: site2
        options:
          - quz
          - quuz
```

You may also specify `default` options that will be used if no site slug matches.

```yaml
field1:
  _has:
    fn: site-specific-select
    sites:
      -
        slug: site1
        options:
          - foo # looks like Foo
          - bar # looks like Bar
          - baz # looks like Baz
    default:
      - quz
      - quuz
```
