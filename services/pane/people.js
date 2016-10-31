const _ = require('lodash'),
  ds = require('dollar-slice'),
  dom = require('@nymag/dom'),
  tpl = require('../tpl'),
  pane = require('./'),
  peoplePaneController = require('../../controllers/people-pane'),
  filterableList = require('../filterable-list'),
  site = require('../site'),
  db = require('../edit/db');

function formatUserListItem(user) {
  var item = `<span class="user-item-name">${user.name}</span>`;

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

function getPeopleList() {
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

function openPeople() {
  return Promise.all([getMyData(), getPeopleList()]).then(function generatePeopleTabs(promises) {
    var myData = promises[0],
      peopleList = promises[1],
      el = pane.open([{
        header: 'Me',
        content: getMyselfPane(myData)
      }, {
        header: 'People',
        content: filterableList.create(peopleList, {
          inputPlaceholder: 'Search People',
          click: _.noop
        })
      }], {
        header: 'Log Out',
        content: dom.create('<div></div>') // no content, since we're hijacking the logout click controller
      }, 'left');

    ds.controller('people-pane', peoplePaneController);
    ds.get('people-pane', el);
  });
}

module.exports = openPeople;
_.set(window, 'kiln.services.panes.openPeople', module.exports);
