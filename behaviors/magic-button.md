# magic-button

Append a magic button to an input.

## Arguments

* **field** _(optional)_ a field to grab the value from
* **component** _(optional)_ a name of a component to grab the component ref from
* **transform** _(optional)_ a transform to apply to the grabbed value
* **url** _(optional)_ to get data from
* **property** _(optional)_ to get from the returned data
* **moreMagic** _(optional)_ to run the returned value through more transforms, api calls, etc

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

Magic buttons are extremely powerful, but can be a little confusing to configure. This is what they generally look like:

1. specify a `field` or `component`. The button will grab the value or ref, respectively
2. specify a `transform`. Transforms are useful when doing api calls with that data
3. specify a `url` to do the api call against. It will do a GET request to `url + transformed data`
4. specify a `property` to grab from the result of that api call. You can use `_.get()` syntax, e.g. `foo.bar[0].baz`
5. add `moreMagic` if you need to do anything else to the returned data

**All of these arguments are optional!**

## Here are some examples:

_Note: MediaPlay is the name of our image server._

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "just grab the primary headline"

```yaml
field: primaryHeadline
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"

```yaml
field: url
transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
url: [mediaplay api url]
property: metadata.caption
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"

```yaml
component: mediaplay-image
transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
url: $SITE_PREFIX (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
property: url
```

### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the image url from a lede component, then ask mediaplay for the caption"

```yaml
component: feature-lede
transform: getComponentInstance
url: $SITE_PREFIX
property: imgUrl
moreMagic:
  -
    transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
    url: [mediaplay api url]
    property: metadata.caption
```

☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
