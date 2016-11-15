const _ = require('lodash'),
  ds = require('dollar-slice'),
  dom = require('@nymag/dom'),
  tpl = require('../tpl'),
  pane = require('./'),
  directoryPaneController = require('../../controllers/directory-pane'),
  filterableList = require('../filterable-list'),
  site = require('../site'),
  db = require('../edit/db');

function formatUserListItem(user) {
  var item = '<span class="user-item-name">';

  if (user.name) {
    item += `${user.name}</span>`;
  } else {
    // user hasn't logged in for the first time, thus we haven't grabbed their name
    // from their provider (or the name might be blank)
    item += `${user.username} <span class="user-item-no-login">(has never logged in)</span></span>`;
  }

  if (user.title) {
    item += `<br /><span class="user-item-title">${user.title}</span>`;
  }

  return item;
}

function getMyData() {
  var el = dom.find('.kiln-toolbar'),
    userAtProvider = el.getAttribute('data-current-user'),
    encoded = window.btoa(userAtProvider);

  return db.get(`${site.get('prefix')}/users/${encoded}`);
}

function getDirectoryList() {
  return db.get(`${site.get('prefix')}/users`)
    .then((refs) => Promise.all(_.map(refs, (ref) => db.get(ref)))) // asynchronously get data for all users
    .then((users) => _.map(users, function (user) {
      return {
        id: user.username + '@' + user.provider,
        title: formatUserListItem(user)
      };
    }))
    .catch(() => []);
}

function getMyselfPane(myData) {
  var el = tpl.get('.myself-template'),
    nameInput = dom.find(el, '.my-name-input'),
    titleInput = dom.find(el, '.my-title-input');

  if (myData.name) {
    nameInput.value = myData.name;
  }

  if (myData.title) {
    titleInput.value = myData.title;
  }

  return el;
}

function openDirectory() {
  return Promise.all([getMyData(), getDirectoryList()]).then(function generateDirectoryTabs(promises) {
    var myData = promises[0],
      directoryList = promises[1],
      el = pane.open([{
        header: 'Me',
        content: getMyselfPane(myData)
      }, {
        header: 'Directory',
        content: filterableList.create(directoryList, {
          inputPlaceholder: `Search People on ${site.get('name')}`,
          click: _.noop
        })
      }], {
        header: 'Log Out',
        content: dom.create('<div></div>') // no content, since we're hijacking the logout click controller
      }, 'left');

    ds.controller('directory-pane', directoryPaneController);
    ds.get('directory-pane', el);
  });
}

module.exports = openDirectory;
_.set(window, 'kiln.services.panes.openDirectory', module.exports);
