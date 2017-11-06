# Kiln

![Kiln](http://i.imgur.com/RleQNNh.png?1)

[![CircleCI](https://circleci.com/gh/clay/clay-kiln.svg?style=svg)](https://circleci.com/gh/clay/clay-kiln) [![Coverage Status](https://coveralls.io/repos/nymag/clay-kiln/badge.svg?branch=master&service=github&t=C3xeVy)](https://coveralls.io/github/nymag/clay-kiln?branch=master)

🔥 Editing tools for Clay 🔥

## Install

```
npm install --save clay-kiln
```

Kiln comes with compiled scripts and styles, and will inline most of them in edit mode. `dist/clay-kiln-edit.js` must be added to your Clay page in edit mode, and copied / served from a public directory by your script compilation.

## Usage

To include it in your site, add it to a bootstrap with non-empty data, e.g. `allow: true`.

```yaml
components:
  clay-kiln:
    instances:
      general:
        allow: true
```

Then create a _non-editable_ component list in your layout (preferably near the end), and add a reference to your Kiln instance.

```yaml
components:
  layout:
    instances:
      article:
        kilnInternals:
          -
            _ref: /components/clay-kiln/instances/general
```

Make sure you add that component list to your layout template, and double check that it isn't editable.

```handlebars
<div class="kiln-internals">{{ > component-list kilnInternals }}</div>
```

Kiln will display a small toolbar to logged-in users when viewing any page in that layout, and a full toolbar when you visit a page with `?edit=true`.


## Guides

When viewing a page in _edit mode_, Kiln will "decorate" your components with information and functionality that allows you to edit them, based on your component schemas. It allows you to open forms to edit components, manipulate those components in lists, create new pages using shared layouts, and preview and publish changes for the rest of the world to see. By keeping the editing experience consistent, it allows many different types of components to coexist in the same ecosystem, while decreasing both the maintenance cost for developers and the mental overhead for end users.

* [Editing Components with Forms](https://github.com/clay/clay-kiln/wiki/Editing-Components-with-Forms)
* [Adding / Removing / Reordering Components in Lists](https://github.com/clay/clay-kiln/wiki/Component-Lists-and-Properties)
* [Saving Components and Cross-Component Communication](https://github.com/clay/clay-kiln/wiki/Cross-Component-Communication)
* [Creating, Publishing, and Scheduling Pages](https://github.com/clay/clay-kiln/wiki/Creating,-Publishing,-and-Scheduling-Pages)
* [Anatomy of a Component Schema](https://github.com/clay/clay-kiln/wiki/Anatomy-of-a-Component-Schema)
* [Extending Kiln](https://github.com/clay/clay-kiln/wiki/Kiln-APIs)

### Inside the Kiln

As you can see in the template, Kiln will load one of three different application bundles, depending on the user state.

* [`view-public.js`](https://github.com/clay/clay-kiln/blob/master/view-public.js) is run if nobody is logged in, allowing people to easily use the `Shift+CLAY` shortcut.
* [`view.js`](https://github.com/clay/clay-kiln/blob/master/view.js) is run for logged-in users when viewing pages, and displays the small toolbar with access to the Clay Menu.
* [`edit.js`](https://github.com/clay/clay-kiln/blob/master/edit.js) is the fully-featured edit experience, for logged-in users in edit mode.

### Testing

* `npm run lint` will run `eslint` on everything, making sure it conforms to our JavaScript style guide
* `npm run test-local` will `lint` and run `karma` tests on the code, auto-watching for changes
* `npm run build` will run `webpack`, compiling the scripts and styles to the `dist/` folder
* `npm run watch` will run `webpack` and watch for changes
* `npm run prepublish` will run `webpack` with production flags enabled, compiling and minifying the scripts and styles
