var keycode = require('keycode'),
  _includes = require('lodash/collection').includes, // todo: require(lodash/method) when we upgrade to lodash 4
  secretKilnKey = '';

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

function showLogo() {
  var logo = document.querySelector('.clay-kiln-logo');

  if (logo) {
    logo.classList.add('show');
  }
}

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
