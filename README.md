# clay-kiln

[![Coverage Status](https://coveralls.io/repos/nymag/clay-kiln/badge.svg?branch=master&service=github&t=C3xeVy)](https://coveralls.io/github/nymag/clay-kiln?branch=master)

🔥 Editing tools for Clay

![Kiln](http://i.imgur.com/RleQNNh.png?1)

## Install

```
npm install --save clay-kiln
```

Kiln will automatically compile scripts and styles after installing.

## Usage

To include it in your site, add it to your bootstrap:

```yaml
components:
  clay-kiln:
      allow: true
```

Then add it to any layouts you want to use it on:

```yaml
components:
  layout:
    instances:
      article-layout:
        top:
          -
            _ref: /components/clay-kiln
```

Kiln will automatically display its toolbar (and load its scripts and styles) when you visit a page with `?edit=true` as a query param.

### Extending Kiln

Kiln has a simple client-side api that is used to extend its functionality. It consists of a global `kiln` object, with `behaviors` (object), `decorators` (array), and `validators` (array).

* [Behaviors](https://github.com/nymag/clay-kiln/tree/master/behaviors#behaviors) — run on each field when opening forms
* [Decorators](https://github.com/nymag/clay-kiln/tree/master/decorators#decorators) — run on each field (elements with `data-editable`) when the page is loaded
* [Validators](https://github.com/nymag/clay-kiln/tree/master/validators#validators) — run when opening the `PUBLISH` pane and returns errors and warnings
* [Plugins](https://github.com/nymag/clay-kiln/tree/master/README.md#plugins) — run before kiln code is initialized, and can hook into events and call kiln services.

To add custom `behaviors`, `decorators`, `validators`, and `plugins` simply add them to the `kiln` object before the page's `DOMContentLoaded` event fires.

#### Plugins

Plugins are added to the global `window.kiln.plugins` object. They are initialized _before_ kiln services run, so they can add event listeners for things like saving, publishing, adding component selectors, etc. They may also call certain exported `window.kiln.services`.

```js
// my-plugin.js

window.kiln.plugins['my-plugin'] = function () {
  // you can add event handlers
  window.kiln.on('save', function (data) {
    console.log(window.kiln.services.label(data.name)); // and call kiln services
  });
}
```

**Events:**

* `save` - after a component is saved
* `schedule`
* `unschedule`
* `publish`
* `unpublish`
* `select` - after a component is selected
* `unselect`
* `add-selector` - after a selector is added to a component
* `form:open` - after a form is opened
* `form:close` - after a form is closed (whether or not data was changed)

## Contributing

### Inside The Kiln

As `behvaiors`, `decorators`, and `validators` are standardized, we may add them into the kiln directly. They live in their respective folders, and can be overridden by clay instances as needed.

* [Behaviors](https://github.com/nymag/clay-kiln/tree/master/behaviors#behaviors) — scripts and styles for standard behaviors
* [Controllers](https://github.com/nymag/clay-kiln/tree/master/controllers#controllers) — handlers attached to editable components, forms, toolbars, etc
* [Decorators](https://github.com/nymag/clay-kiln/tree/master/decorators#decorators) — scripts for standard decorators, including `focus` and `placeholder`
* [Media](https://github.com/nymag/clay-kiln/tree/master/media) — svgs used by standard behaviors, decorators, and other kiln elements
* [Services](https://github.com/nymag/clay-kiln/tree/master/services) — internal services including editing, database access, and form creation
* [Styleguide](https://github.com/nymag/clay-kiln/tree/master/styleguide) — Kiln styleguide, used by standard behaviors, decorators, validators, and other kiln elements
* [Validators](https://github.com/nymag/clay-kiln/tree/master/validators#validators) — scripts for standard validators

### Client.js

This file bootstraps internal and external `behaviors`, `decorators`, and `validators`. When the `DOMContentLoaded` event fires it instantiates a `component-edit` controller for each component on the page. This controller calls the decorators it needs (to attach click events to editable elements, or add placeholders, etc) and instantiates any services required (like component selectors).

### Testing

* `npm test` will run `eslint` and `karma` tests (the latter being run on browserify).
* `npm run lint` will run `eslint` locally on the script folders, as well as `client.js`
* `npm run test-local` will run `karma` tests locally (using `karma.local.conf.js`) and auto-watch for changes
* `gulp watch` will automatically re-compile scripts and styles on change
