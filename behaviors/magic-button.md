# magic-button

Append a magic button to an input.

## Arguments

* **field** _(optional)_ a field to grab the value from
* **component** _(optional)_ a name of a component to grab the component ref from
* **transform** _(optional)_ a transform to apply to the grabbed value
* **url** _(optional)_ to get data from
* **property** _(optional)_ to get from the returned data

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

Magic buttons are extremely powerful, but can be a little confusing to configure. This is what they generally look like:

1. specify a `field` or `component`. The button will grab the value or ref, respectively
2. specify a `transform`. Transforms are useful when doing api calls with that data
3. specify a `url` to do the api call against. It will do a GET request to `url + transformed data`
4. specify a `property` to grab from the result of that api call. You can use `_.get()` syntax, e.g. `foo.bar[0].baz`

**All of these arguments are optional!**

## Here are some examples:

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "just grab the primary headline"

```yaml
field: primaryHeadline
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"

```yaml
field: url
transform: mediaplayUrl (strips out stuff that ambrose does't want in the api call)
url: [ambrose api for images]
property: metadata.credit
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"

```yaml
component: mediaplay-image
transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
url: $SITE_PREFIX (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
property: url
```

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
