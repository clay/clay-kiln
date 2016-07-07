# simple-list-primary

Appends double-click functionality to items in a [simple-list](https://github.com/nymag/clay-kiln/blob/master/behaviors/simple-list.md).

## Arguments

* **propertyName** _(required)_ name of the property that is considered "primary"
* **badge** _(optional)_ string to put in the badge. defaults to property name

This will allow users to double-click items in a simple-list to select a "primary" item. It will also append a small badge to the "primary" item. Only one item may be "primary" at a time.

_Note:_ Add this behavior **after** simple-list.
