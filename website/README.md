You will need to have `Node >= 8.x` and `Yarn >= 1.5`.

# Run the local server

1. Make sure all the dependencies for the website are installed:

```sh
$ yarn
```
or
```sh
$ npm install
```

2. Go to the `website` directory and run your dev server:

```sh
$ yarn start
```
or
```sh
$ npm run start
```

## Directory Structure

Your project file structure should look something like this

```
root-directory
  ├── docs
    ├── docs.md
  website/
    ├── README.md
    ├── core
      └── Footer.js
    ├── i18n
      └── en.json
    ├── package.json
    ├── pages
      └── en
        └── index.js
    ├── sidebars.json
    ├── siteConfig.js
    └── static
      ├── css
        └── custom.css
      └── img
        ├── favicon
        └── logo.svg
    └── versioned_docs
      └── version 0.0.0
        ├── docs.md
    └── versioned_sidebars
      ├── version-0.0.0-sidebars.json
```

# Versioning the Code
To create a version of the docs to match the version of an NPM release, run this command with the version number of the release.
```
$ yarn version X.X.X
```
or
```
$ npm version X.X.X
```

# Publish the website
The Clay-kiln website will live on GitHub page. You just need to run the following commands:
```
$ yarn build
```
or
```
$ npm run build
```

Then you just need to deploy the static files generated. These files will be pushed to the `gh-page` branch.
```
$ yarn deploy
```
or
```
$ npm run deploy
```
