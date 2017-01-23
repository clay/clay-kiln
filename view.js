'use strict'; // eslint-disable-line

// note: use strict above is applied to the whole browserified doc
const references = require('./services/references'),
  dom = require('@nymag/dom'),
  EditorToolbar = require('./controllers/kiln-toolbar-view'),
  keycode = require('keycode'),
  toggleEdit = require('./services/toggle-edit'),
  eventify = require('eventify'),
  plugins = require('./services/plugins'),
  progress = require('./services/progress'),
  _ = require('lodash'); // todo: when we have webpack 2, use es6 w/ tree-shaking

let secretKilnKey = '';

// show progress indicator as well as "Loading" message
progress.start('offline');

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// kick off controller loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  window.kiln = window.kiln || {}; // make sure global kiln object exists
  eventify.enable(window.kiln); // enable events on global kiln object, so plugins can add listeners
  plugins.init(); // initialize plugins before adding handlers
  return new EditorToolbar(dom.find('[' + references.referenceAttribute + '*="/components/clay-kiln"]'));
});

/**
 * show clay logo
 */
function showLogo() {
  var logo = document.querySelector('.clay-kiln-logo');

  if (logo) {
    logo.classList.add('show');
  }
}

/**
 * listen for shift + C L A Y
 * when users hit that, show the logo (then enter edit mode on keyup)
 */
document.addEventListener('keydown', function (e) {
  var key = keycode(e);

  if (_.includes(['c', 'l', 'a', 'y'], key) && e.shiftKey === true) {
    secretKilnKey += key;
  } else {
    // if we hit any other character, reset the key
    secretKilnKey = '';
  }

  // check secret key
  if (secretKilnKey === 'clay') {
    showLogo();
  } else if (secretKilnKey.length > 4 && _.includes(secretKilnKey, 'clay')) {
    toggleEdit();
  } else if (secretKilnKey.length > 4) {
    // if we hit more than four characters, reset the key
    secretKilnKey = '';
  }
});

document.addEventListener('keyup', function () {
  if (secretKilnKey === 'clay') {
    toggleEdit();
  }
});
