var files, settings,
  istanbul = require('browserify-istanbul'),
  babelify = require('babelify'),
  _ = require('lodash');

files = [
  'test/setup.js',
  'behaviors/*.js',
  'services/**/*.js',
  'decorators/*.js',
  'validators/*.js'
];

settings = {
  autoWatch: false,
  colors: true,
  singleRun: true,
  transports: ['websocket'],
  browserify: {
    debug: true,
    transform: [istanbul({
      ignore: ['**/node_modules/**'],
      defaultIgnore: true
    }), babelify.configure({
      presets: ['es2015']
    })]
  },
  coverageReporter: {
    type: 'lcovonly',
    dir: 'coverage/',
    includeAllSources: true,
    watermarks: {
      statements: [50, 75],
      functions: [50, 75],
      branches: [50, 75],
      lines: [50, 75]
    }
  },
  reporters: ['dots', 'coverage'],
  files: files,
  frameworks: ['mocha', 'chai', 'sinon', 'browserify'],
  preprocessors: {
    'controllers/**/*.js': ['browserify'],
    'behaviors/**/*.js': ['browserify'],
    'services/**/*.js': ['browserify'],
    'decorators/**/*.js': ['browserify'],
    'validators/**/*.js': ['browserify']
  },
  plugins: [
    'karma-coverage',
    'karma-browserify',
    'karma-browserstack-launcher',
    'karma-chai',
    'karma-chrome-launcher',
    'karma-firefox-launcher',
    'karma-mocha',
    'karma-safari-launcher',
    'karma-sinon'
  ]
};

module.exports = function (karma) {
  karma.set(_.assign(settings, {
    // browerstack config + launchers
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      retryLimit: 0 // yolo
    },
    customLaunchers: {
      // browserstack loves snake_case
      // jshint ignore:start
      chromeMac: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '45.0',
        os: 'OS X',
        os_version: 'Yosemite'
      },
      firefoxMac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '42.0',
        os: 'OS X',
        os_version: 'Yosemite'
      }
      // safari 8 doesn't support template strings
      // safariMac: {
      //   base: 'BrowserStack',
      //   browser: 'safari',
      //   browser_version: '8',
      //   os: 'OS X',
      //   os_version: 'Yosemite'
      // }
      // ie12 (edge) doesn't support ELement#matches, so we don't support it!
      // edge: {
      //   base: 'BrowserStack',
      //   browser: 'edge',
      //   browser_version: '12.0',
      //   os: 'Windows',
      //   os_version: '10'
      // }
      // mobile safari 8.3 doesn't support template strings
      // todo: test on ios 9 when browserstack adds it
      // mobileSafari: {
      //   base: 'BrowserStack',
      //   device: 'iPhone 6',
      //   os: 'ios',
      //   os_version: '8.3'
      // }
      // jshint ignore:end
    },
    browsers: ['chromeMac', 'firefoxMac']
  }));
};

module.exports.files = files;
module.exports.settings = settings;
