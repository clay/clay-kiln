# Components

[Components are reusable, configurable, self-contained bits of the web.](https://github.com/nymag/amphora/wiki#clay-is-divided-into-components)

Components in Clay consist of templates, styles, JavaScript models \(data handling\) and controllers \(client-side functionality\), as well as `schema.yml` files that define how they're edited with Kiln. General information on components is available in the [Amphora docs](http://clay.github.io/amphora/), so this section will limit itself to discussing the requirements needed to edit components in Kiln.

## Template

Kiln assumes that every component has a [Handlebars](http://handlebarsjs.com/) template, and that it uses `data-uri` to reference the URI of the component instance. For regular components that live in the `<body>` of a page, you must use a _single root tag_ that contains `data-uri`:

```handlebars
<div data-uri="{{ default _ref _self}}">
<!-- stuff inside the component, including elements and <style> tags -->
</div>
```

For components that live in the `<head>` of the page, templates are handled a little differently. As `<meta>` tags cannot contain child elements \(almost all `<head>` components consist of `<meta>` tags\), you must use an html comment at the beginning of your component:

```handlebars
<!-- data-uri="{{ default _ref _self}}" -->
<meta name="something" content="something else" />
<meta name="another thing" content="another bit of data" />
```

The root element of `<body>` components may include other attributes, such as `data-editable` or `data-placeholder` \(more on those in Editing Components\), and must be _relatively positioned_ so the Component Selectors can display correctly.

{% hint style="info" %}

#### Note

Templates must be precompiled and added to `window.kiln.componentTemplates` for Kiln to re-render components after saving.

{% endhint %}

## model.js
`models.js` is an optional file a component directory may contain. It's roll is to expose two lifecycle hooks that allow an author to transform the component's data: `save`, which executes before the model is saved. and `render`, which executes before the HTML is rendered.

`save` and `render` are both optional, but `model.js` must export at least one of these functions. Both hooks take the same signature, and are expected to return the data. For asynchronous operations, `save` and `render` may also return a promise.

- `uri`: the component's uri
- `data`: the data associated with the component. This object will also be returned
- `locals`: information about the site defined outside the model

Example:  

```js
module.exports.save = (uri, data, locals) => {

  // set a timestamp on save
  data.timestamp = Date.now().toString()

  // must return data
  return data;
};

module.exports.render = (uri, data, locals) => {

  // add data to the model from an external service
  return fetch('https://someservice.com/')
    .then(({body}) => body.json())
    .then((extraData) => {
      data.extraData = extraData
      return data
    })
};
```
If you're unsure of which method to use `save()` is usually preferable, as it only runs when data is saved. Calling the `render()` method \(every time a component renders\) to do slow or intensive logic will slow down your component for end-users.

Models must be compiled and added to `window.kiln.componentModels` for Kiln to call them when saving and re-rendering components.

## client.js
`client.js` is the component's code that is exectued in the client in view mode only (i.e., not edit mode). This file is optional. It expects a single default export which takes the following signature, where `el` is root HTML element of the component:

```js
module.exports = (el) => {
  // client-side javascript goes here.
}
```
Since `client.js` is not only exected in view mode it may be necessary to add additional styling to the component when in edit mode. You may take advantage of the `.kiln-edit-mode` class on the `<body>` tag for this purpose.

## upgrade.js
This file contains logic for upgrading between two versions of a component. For more info see (http://clay.github.io/amphora/docs/upgrade.html)


## Schema

Schemas \(or _schemata_, for pedants like myself\) are the main connective tissue between components and Kiln. They define what kinds of fields components have, as well as how those fields are grouped. They also provide `_description` text for the components' Info Modals, `_version` for upgrading data programmatically, `_allowBookmarks` for easy duplication across pages, and `_confirmRemoval` for extra peace-of-mind on components like ads.

Schemas for components that are currently on the page are automatically parsed by Amphora and added to the page when Kiln loads. Schemas for other components are added when those components are added.

## Variations

Components can have variations, which is defined by corresponding stylesheets in the site's styleguide folder. Variations are defined as `component-name_variation-name.css`. Kiln will automatically generate a select input with the variations. This input will be in the 'Component Variation' tab in the Settings group. If the component doesn't have a Settings group set, Kiln will generate this too.
