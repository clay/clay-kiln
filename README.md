# kiln

[![Coverage Status](https://coveralls.io/repos/nymag/kiln/badge.svg?t=cuxfVU)](https://coveralls.io/r/nymag/kiln)

Editing tools for Clay

## Folder Structure Overview

* [Behaviors](https://github.com/nymag/kiln/tree/master/behaviors) - contains `js` and `scss` that are composed when opening forms
* [Controllers](https://github.com/nymag/kiln/tree/master/controllers) - `dollar-slice` controllers that are instantiated for components, forms, and overlays. _These are slowly being phased out as their functionality is moved into generic services._
* [Services](https://github.com/nymag/kiln/tree/master/services) - `js` services, including editing, database access, and form creation
* [Decorators](https://github.com/nymag/kiln/tree/master/decorators) - `js` decorators that run on editable elements (in components) when the page is loaded
* [Styleguide](https://github.com/nymag/kiln/tree/master/styleguide) - `scss` styles that are reused amongst behaviors, forms, etc

## Client.js

This file bootstraps our behaviors and decorators, and instantiates a `component-edit` controller for each component on the page. This controller calls the decorators it needs (to attach click events to editable elements, or add placeholders, etc).

## Testing

* `npm test` will run `eslint` and `karma` tests (the latter being run on browserify).
* `eslint client.js behaviors controllers services` will run `eslint` locally
* `karma start karma.local.conf.js` will run `karma` tests locally
