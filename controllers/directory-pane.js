const dom = require('@nymag/dom'),
  _ = require('lodash'),
  progress = require('../services/progress'),
  site = require('../services/site'),
  pane = require('../services/pane'),
  db = require('../services/edit/db');

function getUserID() {
  var el = dom.find('.kiln-toolbar'),
    userAtProvider = el.getAttribute('data-current-user'),
    encoded = window.btoa(userAtProvider);

  return `${site.get('prefix')}/users/${encoded}`;
}

module.exports = function () {
  function Constructor(el) {
    this.nameEl = dom.find(el, '.my-name-input');
    this.titleEl = dom.find(el, '.my-title-input');
    this.currentUser = getUserID();
  }

  Constructor.prototype = {
    events: {
      '.myself-form submit': 'onSave',
      '#pane-tab-dynamic click': 'onLogout'
    },

    onSave: function (e) {
      let name = this.nameEl.value,
        title = this.titleEl.value,
        uri = this.currentUser;

      e.preventDefault();

      progress.start('save');
      return db.get(uri)
        .then(function (data) {
          _.assign(data, { name: name, title: title });
          return db.save(uri, data)
            .then(function () {
              pane.close();
              progress.done();
              progress.open('save', 'User Updated!');
            });
        }).catch(progress.error('Error saving user'));
    },

    onLogout: function (e) {
      e.stopPropagation();

      window.location.href = `${site.get('path')}/auth/logout`;
    }
  };
  return Constructor;
};
