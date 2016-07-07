# component-ref

Appends a hidden field to enable component instances to affect other component instances.

## Arguments

* **selector** _(optional)_ a full selector to find on the page
* **name** _(optional)_ a component name

You can specify a full selector (e.g. `domain.com/components/foo/instances/bar`) if you need to find a specific instance, but the more common use case is specifying a name (e.g. `foo`). Both will return an array of component references, but the latter will search for components in the `<head>` of the page rather than just the body.
