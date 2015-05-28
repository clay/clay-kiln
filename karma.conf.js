var istanbul = require('browserify-istanbul');

var files = [
  'controllers/*.test.js',
  'behaviors/*.test.js',
  'services/*.test.js'
];

module.exports = function (karma) {
  'use strict';

  karma.set({
    autoWatch: false,
    colors: true,
    singleRun: true,
    transports: ['websocket'],
    browserify: {
      debug: true,
      transform: ['es6ify', istanbul({
        ignore: ['**/node_modules/**', '**/test/**', '**/tests/**'],
        defaultIgnore: true
      })]
    },
    // browerstack config + launchers
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      retryLimit: 0 // yolo
    },
    coverageReporter: {
      type : 'lcovonly',
      dir : 'coverage/',
      includeAllSources: true,
      watermarks: {
        statements: [ 50, 75 ],
        functions: [ 50, 75 ],
        branches: [ 50, 75 ],
        lines: [ 50, 75 ]
      }
    },
    customLaunchers: {
      // browserstack loves snake_case
      // jshint ignore:start
      chromeMac: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '39.0',
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
    reporters: ['dots', 'coverage'],
    files: files,
    frameworks: ['mocha', 'chai', 'sinon', 'browserify'],
    browsers: ['chromeMac'],
    preprocessors: {
      'controllers/**/*.js': ['browserify'],
      'behaviors/**/*.js': ['browserify'],
      'services/**/*.js': ['browserify']
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
  });
};