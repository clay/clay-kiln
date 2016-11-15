const ds = require('dollar-slice'),
  _ = require('lodash'),
  tpl = require('../tpl'),
  pane = require('./'),
  site = require('../site'),
  dom = require('@nymag/dom'),
  clayMenuController = require('../../controllers/clay-menu');

function openClayMenu() {
  var pageContent = dom.create(`<img class="fakey" src="${site.get('assetPath')}/media/components/clay-kiln/fakey.png" />`),
    el = pane.open([{
      header: 'Pages',
      content: pageContent
    }], {
      header: 'Settings',
      content: tpl.get('.settings-tab-template')
    }, 'left');

  ds.controller('clay-menu', clayMenuController);
  ds.get('clay-menu', el);
}

module.exports = openClayMenu;
_.set(window, 'kiln.services.panes.openClayMenu', module.exports);
