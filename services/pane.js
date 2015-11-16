var _ = require('lodash'),
  dom = require('./dom'),
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
    el = document.importNode(template.content, true);

  // add header and contents
  el.querySelector('.pane-header').innerHTML = header;
  el.querySelector('.pane-inner').appendChild(innerEl);

  return el;
}

/**
 * close an open pane
 */
function close() {
  var pane  = dom.find('.kiln-toolbar-pane-background');

  if (pane) {
    dom.removeElement(pane);
  }
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

  close();
  dom.insertBefore(toolbar, el);
  // init controller for pane background
  ds.controller('pane', paneController);
  ds.get('pane', toolbar.previousElementSibling);
  // init controller for publish pane
  ds.controller('publish-pane', publishPaneController);
  ds.get('publish-pane', toolbar.previousElementSibling.querySelector('.actions'));
}

function addPreview(preview) {
  if (preview) {
    return `<span class="error-preview">${preview}</span>`;
  } else {
    return '';
  }
}

function addErrors(errors) {
  return _.reduce(errors, function (el, error) {
    var errorEl = dom.create(`
        <div class="publish-error">
          <span class="label">${error.rule.label}:</span>
          <span class="description">${error.rule.description}</span>
          <ul class="errors"></ul>
        </div>
      `),
      list = dom.find(errorEl, 'ul');

    // add each place where the error occurs
    _.each(error.errors, function (item) {
      var itemEl = dom.create(`<li><span class="error-label">${item.label}</span>${addPreview(item.preview)}</li>`);

      list.appendChild(itemEl);
    });

    el.appendChild(errorEl);
    return el;
  }, document.createDocumentFragment());
}

function openValidationErrors(errors) {
  var header = 'Before you can publish&hellip;',
    messageEl = dom.create(`
      <div class="error-message">This page is missing things needed to publish.<br />Address the following and try publishing again.</div>
    `),
    errorsEl = addErrors(errors),
    innerEl = document.createDocumentFragment(),
    el;

  innerEl.appendChild(messageEl);
  innerEl.appendChild(errorsEl);

  el = createPane(header, innerEl);

  close();
  dom.insertBefore(toolbar, el);
  // init controller for pane background
  ds.controller('pane', paneController);
  ds.get('pane', toolbar.previousElementSibling);
}

module.exports.close = close;
module.exports.openPublish = openPublish;
module.exports.openValidationErrors = openValidationErrors;
