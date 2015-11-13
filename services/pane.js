var dom = require('./dom'),
  ds = require('dollar-slice'),
  paneController = require('../controllers/pane'),
  publishPaneController = require('../controllers/publish-pane'),
  toolbar = dom.find('.kiln-toolbar');

/**
 * create pane
 * @param {string} header
 * @param {Element|DocumentFragment} innerEl
 * @returns {Element}
 */
function createPane(header, innerEl) {
  var template = dom.find('.kiln-pane-template'),
    el;

  // add header and contents before importing
  template.content.querySelector('.pane-header').innerHTML = header;
  template.content.querySelector('.pane-inner').appendChild(innerEl);

  // import template
  el = document.importNode(template.content, true);
  return el;
}

/**
 * open publish pane
 */
function openPublish() {
  var header = 'Schedule Publish',
    actionsEl = dom.create(`
      <div class="actions">
        <button class="publish-now">Publish Now</button>
      </div>
    `),
    el = createPane(header, actionsEl);

  dom.insertBefore(toolbar, el);
  // init controller for pane background
  ds.controller('pane', paneController);
  ds.get('pane', toolbar.previousElementSibling);
  // init controller for publish pane
  ds.controller('publish-pane', publishPaneController);
  ds.get('publish-pane', toolbar.previousElementSibling.querySelector('.actions'));
}

module.exports.openPublish = openPublish;
