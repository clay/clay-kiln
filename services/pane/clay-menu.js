const ds = require('dollar-slice'),
  _ = require('lodash'),
  tpl = require('../tpl'),
  pane = require('./'),
  clayMenuController = require('../../controllers/clay-menu');

function openClayMenu() {
  var el = pane.open([/* todo: add My Pages and All Pages tabs */], {
    header: 'Settings',
    content: tpl.get('.settings-tab-template'),
    active: true // todo: in the future, default to "My Pages"
  }, 'left');

  ds.controller('clay-menu', clayMenuController);
  ds.get('clay-menu', el);
}

module.exports = openClayMenu;
_.set(window, 'kiln.services.panes.openClayMenu', module.exports);
