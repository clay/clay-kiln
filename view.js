'use strict'; // eslint-disable-line

// note: use strict above is applied to the whole browserified doc
const references = require('./services/references'),
  dom = require('@nymag/dom'),
  EditorToolbar = require('./controllers/kiln-toolbar'),
  keycode = require('keycode'),
  _ = require('lodash'); // todo: when we have webpack 2, use es6 w/ tree-shaking

let secretKilnKey = '';

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// kick off controller loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
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
 * enter edit mode
 */
function toggleEdit() {
  var url = location.href,
    query = '?edit=true',
    endQuery = '&edit=true',
    queryIndex = url.indexOf(query),
    endQueryIndex = url.indexOf(endQuery);

  if (queryIndex > -1) {
    url =  url.substring(0, queryIndex);
  } else if (endQueryIndex > -1) {
    url = url.substring(0, endQueryIndex);
  } else if (url.indexOf('?') > -1) {
    url = url + endQuery;
  } else {
    url = url + query;
  }

  location.href = url;
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
