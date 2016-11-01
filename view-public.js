'use strict'; // eslint-disable-line
const keycode = require('keycode'),
  _includes = require('lodash/includes');

let secretKilnKey = '';

// load logo styles
require('./styleguide/logo.scss');

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

  if (_includes(['c', 'l', 'a', 'y'], key) && e.shiftKey === true) {
    secretKilnKey += key;
  } else {
    // if we hit any other character, reset the key
    secretKilnKey = '';
  }

  // check secret key
  if (secretKilnKey === 'clay') {
    showLogo();
  } else if (secretKilnKey.length > 4 && _includes(secretKilnKey, 'clay')) {
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
