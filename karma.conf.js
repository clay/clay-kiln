var files, settings,
  istanbul = require('browserify-istanbul'),
  _ = require('lodash');

files = [
  'test/setup.js',
  'controllers/*.js',
  'behaviors/*.js',
  'services/**/*.js',
  'decorators/*.js',
  'publishing-rules/*.js'
];

settings = {
  autoWatch: false,
  colors: true,
  singleRun: true,
  transports: ['websocket'],
  browserify: {
    debug: true,
    transform: ['es6ify', istanbul({
      ignore: ['**/node_modules/**'],
      defaultIgnore: true
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
    'publishing-rules/**/*.js': ['browserify']
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
  'use strict';

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
        browser_version: '43.0',
        os: 'OS X',
        os_version: 'Yosemite'
      },
      firefoxMac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '35.0',
        os: 'OS X',
        os_version: 'Yosemite'
      }
      // ie11 doesn't support us, so we don't support it!
      // ie11: {
      //   base: 'BrowserStack',
      //   browser: 'ie',
      //   browser_version: '11.0',
      //   os: 'Windows',
      //   os_version: '8.1'
      // }
      // iPhone6: {
      //   base: 'BrowserStack',
      //   device: 'iPhone 6',
      //   os: 'ios',
      //   os_version: '8.0'
      // }
      // jshint ignore:end
    },
    browsers: ['chromeMac', 'firefoxMac']
  }));
};

module.exports.files = files;
module.exports.settings = settings;
