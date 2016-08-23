const _ = require('lodash'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  edit = require('../edit'),
  tpl = require('../tpl'),
  previewController = require('../../controllers/preview-pane'),
  pane = require('./');

/**
 * open preview + share pane
 * @returns {Element}
 */
function openPreview() {
  var pageUrl = edit.getPageUrl(),
    previewHeader = 'Preview',
    previewContent = tpl.get('.preview-actions-template'),
    shareHeader = 'Shareable Link',
    shareContent = tpl.get('.share-actions-template'),
    el;

  // set the page url into the responsive preview items
  _.each(dom.findAll(previewContent, 'a'), function (link) {
    link.setAttribute('href', pageUrl);
  });

  // set the page url into the share tab
  dom.find(shareContent, '.share-input').setAttribute('value', pageUrl);

  el = pane.open([{ header: previewHeader, content: previewContent }, { header: shareHeader, content: shareContent }]);

  // init controller
  ds.controller('preview-pane', previewController);
  ds.get('preview-pane', el);
  return el;
}

module.exports = openPreview;
_.set(window, 'kiln.services.panes.openPreview', module.exports);
