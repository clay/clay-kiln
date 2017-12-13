const path = require('path'),
  files = [
    {pattern: 'test/setup.js', watched: false, included: true, served: true}
  ],
  settings = {
    autoWatch: false,
    colors: true,
    singleRun: true,
    preprocessors: {
      'test/setup.js': ['webpack', 'sourcemap']
    },
    frameworks: ['mocha', 'sinon-chai'],
    webpackMiddleware: {
      noInfo: true
    },
    webpack: {
      target: 'web',
      module: {
        rules: [{
          // todo: remove vue-unit (and update vue-unit dep) once vue-unit hits 0.3.0
          test: /node_modules\/(vue-unit|keen-ui|striptags)\//,
          loader: 'babel-loader'
        }, {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        }, {
          test: /\.svg$/,
          use: 'raw-loader'
        }, {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            esModule: false, // todo: enable this when we can use it with keenUI
            extractCSS: true,
            loaders: {
              css: 'css-loader!postcss-loader!sass-loader?data=@import "styleguide/keen-variables.scss";',
              sass: 'css-loader!postcss-loader!sass-loader?data=@import "styleguide/keen-variables.scss";',
              scss: 'css-loader!postcss-loader!sass-loader?data=@import "styleguide/keen-variables.scss";'
            }
          }
        }]
      },
      resolve: {
        extensions: ['.js', '.json', '.vue'],
        alias: {
          keen: path.resolve(__dirname, 'node_modules/keen-ui/src')
        }
      },
      devtool: '#inline-source-map',
      watch: false
    },
    reporters: ['dots', 'coverage'],
    coverageReporter: {
      dir: 'coverage/',
      includeAllSources: true,
      watermarks: {
        statements: [50, 75],
        functions: [50, 75],
        branches: [50, 75],
        lines: [50, 75]
      },
      reporters: [{ type: 'lcovonly' }]
    },
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      retryLimit: 0 // yolo
    },
    customLaunchers: {
      chromeMac: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '59',
        os: 'OS X',
        os_version: 'Sierra'
      },
      firefoxMac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '54',
        os: 'OS X',
        os_version: 'Sierra'
      },
      chromeWindows: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '59',
        os: 'Windows',
        os_version: '10'
      },
      firefoxWindows: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '54',
        os: 'Windows',
        os_version: '10'
      }
      // note: edge doesn't support Element#matches
      // note: safari has a bug where it reloads the page (chrome and firefox do not)
      // note: phantomjs doesn't support Promises
      // note: mobile safari passes all tests, but runs some of them more than once(!!)
    },
    browsers: ['chromeMac', 'firefoxMac', 'chromeWindows', 'firefoxWindows'],
    files: files,
  };

module.exports = function (karma) {
  karma.set(settings);
};

module.exports.files = files;
module.exports.settings = settings;
