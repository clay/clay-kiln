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

> #### info::Note
>
> Templates must be precompiled and added to `window.kiln.componentTemplates` for Kiln to re-render components after saving.

## Model and Controller

Models \(`model.js`\) and controllers \(`client.js` or `controller.js`\) are two types of JavaScript files your components may contain \(a third — `upgrade.js` — is [only used in Amphora](http://clay.github.io/amphora/docs/upgrade.html)\). Models allow components to perform logic on their data before saving and rendering, while controllers add client-side functionality to components. Both are optional.

Controllers are _never_ run in edit mode, as they have the potential to interfere with Kiln. This means that certain embeds \(which rely on 3rd party JavaScript\) may need styling in edit mode. You may take advantage of the `.kiln-edit-mode` class on the `<body>` tag for this purpose.

Models are called when components save and re-render themselves. Both the `save()` and `render()` methods are optional, as many components require either one or the other. They both have the same function signature, and may return objects \(the component data\) or promises \(that resolve to the component data\).

```js
module.exports.save = (uri, data, locals) => {
// do some logic, then return the data that should save into the db
};

module.exports.render = (uri, data, locals) => {
// do some logic, then return the data that should be sent to handlebars
};
```

> #### info::Note
>
> If in doubt, use the `save()` method, as it only runs when data is saved. Calling the `render()` method \(every time a component renders\) to do slow or intensive logic will slow down your component for end-users.

Models must be compiled and added to `window.kiln.componentModels` for Kiln to call them when saving and re-rendering components.

## Schema

Schemas \(or _schemata_, for pedants like myself\) are the main connective tissue between components and Kiln. They define what kinds of fields components have, as well as how those fields are grouped. They also provide `_description` text for the components' Info Modals, `_version` for upgrading data programmatically, and `_confirmRemoval` for extra peace-of-mind on components like ads.

Schemas for components that are currently on the page are automatically parsed by Amphora and added to the page when Kiln loads. Schemas for other components are added when those components are added.

## Variations

Components can have variations, which is defined by corresponding stylesheets in the site's styleguide folder. There is the default variation (`component-name.css`) and variations are defined as `component-name_variation.css`. Kiln will automatically generate a select input with the variations. This input will be in a 'Component Variation' tab in the Settings group. If the component doesn't have a Settings group set, Kiln will generate this too.
