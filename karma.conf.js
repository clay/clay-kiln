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
    // transports: ['websocket'],
    // browerstack config + launchers
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY
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
      },
      ie11: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11.0',
        os: 'Windows',
        os_version: '8.1'
      },
      iPhone6: {
        base: 'BrowserStack',
        device: 'iPhone 6',
        os: 'ios',
        os_version: '8.0'
      }
      // jshint ignore:end
    },
    reporters: ['dots'],
    files: files,
    frameworks: ['mocha', 'chai', 'sinon', 'browserify'],
    browsers: ['chromeMac', 'firefoxMac', 'ie11', 'iPhone6'],
    preprocessors: {
      'controllers/**': ['browserify'],
      'behaviors/**': ['browserify'],
      'services/**': ['browserify']
    },
    plugins: [
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