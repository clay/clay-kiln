var _ = require('lodash'),
  moment = require('moment'),
  dom = require('./dom'),
  ds = require('dollar-slice'),
  state = require('./page-state'),
  paneController = require('../controllers/pane'),
  publishPaneController = require('../controllers/publish-pane');

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
 * open a pane
 * @param {string} header will display at the top of the pane, html accepted
 * @param {Element} innerEl will display inside the pane
 * @returns {Element} pane
 */
function open(header, innerEl) {
  var toolbar = dom.find('.kiln-toolbar'),
    el = createPane(header, innerEl),
    pane;

  close(); // close any other panes before opening a new one
  dom.insertBefore(toolbar, el);
  pane = toolbar.previousElementSibling; // now grab a reference to the dom
  // init controller for pane background
  ds.controller('pane', paneController);
  ds.get('pane', pane);
  // trick browser into doing a repaint, to force the animation
  setTimeout(function () { dom.find(pane, '.kiln-toolbar-pane').classList.add('on'); }, 0);
  return pane;
}

/**
 * create messages for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishMessages(res) {
  var messages = dom.find('.publish-messages'),
    scheduleMessage, stateMessage;

  if (res.published) {
    stateMessage = dom.find(messages, '.publish-state-message');
    if (stateMessage) {
      stateMessage.innerHTML = `Published ${state.formatTime(res.publishedAt)}`;
    }
  }

  if (res.scheduled) {
    scheduleMessage = dom.find(messages, '.publish-schedule-message');
    if (scheduleMessage) {
      scheduleMessage.innerHTML = `Scheduled to publish ${state.formatTime(res.scheduledAt)}.`;
      scheduleMessage.classList.remove('hide');
    }
  }

  return messages;
}

/**
 * create actions for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishActions(res) {
  var actions = dom.find('.publish-actions'),
    today = moment().format('YYYY-MM-DD'),
    now = moment().format('HH:mm'),
    scheduleDate, scheduleTime, unpublish, unschedule;

  // set date and time
  if (actions) {
    scheduleDate = dom.find(actions, '#schedule-date');
    scheduleTime = dom.find(actions, '#schedule-time');

    if (scheduleDate) {
      dom.replaceElement(scheduleDate, dom.create(`<input id="schedule-date" class="schedule-input" type="date" min="${today}" value="${today}" placeholder="${today}"></input>`));
    }

    if (scheduleTime) {
      dom.replaceElement(scheduleTime, dom.create(`<input id="schedule-time" class="schedule-input" type="time" value="${now}" placeholder="${now}"></input>`));
    }
  }

  // unscheduling
  if (res.scheduled) {
    state.toggleScheduled(true); // just in case someone else scheduled this page
    unschedule = dom.find(actions, '.unschedule');
    if (unschedule) {
      unschedule.classList.remove('hide');
    }
  }

  // unpublish (only affects page)
  if (res.published) {
    unpublish = dom.find(actions, '.unpublish');
    if (unpublish) {
      unpublish.classList.remove('hide');
    }
  }

  return actions;
}

/**
 * open publish pane
 * @returns {Promise}
 */
function openPublish() {
  var header = 'Schedule Publish',
    innerEl = document.createDocumentFragment(),
    el;

  return state.get().then(function (res) {
    // append message and actions to the doc fragment
    innerEl.appendChild(createPublishMessages(res));
    innerEl.appendChild(createPublishActions(res));

    // create the root pane element
    el = open(header, innerEl);
    // init controller for publish pane
    ds.controller('publish-pane', publishPaneController);
    ds.get('publish-pane', el.querySelector('.actions'));
  });
}

/**
 * open publish pane
 * @returns {Promise}
 */
function openNewPage() {
  var header = 'Create a New Page',
    innerEl = document.createDocumentFragment();

  innerEl.appendChild(dom.find('.new-page-actions'));
  open(header, innerEl);
}

function addPreview(preview) {
  if (preview) {
    return `<span class="error-preview">${preview}</span>`;
  } else {
    return '';
  }
}

/**
 * format and assemble error messages
 * @param {Object[]} errors
 * @returns {Element}
 */
function addErrors(errors) {
  return _.reduce(errors, function (el, error) {
    var errorEl = dom.find('.publish-errors'),
      errorLabel = dom.find(errorEl, '.label'),
      errorDescription = dom.find(errorEl, '.description'),
      list = dom.find(errorEl, 'ul');

    // reset template label default if available
    if (errorLabel && _.get(error, 'rule.label')) {
      dom.replaceElement(errorLabel, dom.create(`<span class="label">${error.rule.label}:</span>`));
    }

    // reset template description default if available
    if (errorDescription && _.get(error, 'rule.description')) {
      dom.replaceElement(errorDescription, dom.create(`<span class="description">${error.rule.description}</span>`));
    }

    // remove default error messages
    dom.clearChildren(list);

    // add each place where the error occurs
    _.each(error.errors, function (item) {
      var itemEl = dom.create(`<li><span class="error-label">${item.label}</span>${addPreview(item.preview)}</li>`);

      list.appendChild(itemEl);
    });

    el.appendChild(errorEl);
    return el;
  }, document.createDocumentFragment());
}

/**
 * open validation error pane
 * @param {Object[]} errors
 * @param {object} errors[].rule
 * @param {string} errors[].rule.label e.g. 'Required'
 * @param {string} errors[].rule.description e.g. 'Required fields cannot be blank'
 * @param {Object[]} errors[].errors
 * @param {string} errors[].errors[].label e.g. 'Article > Header'
 * @param {string} [errors[].errors[].preview] e.g. 'text in a paragraph TK more text...'
 */
function openValidationErrors(errors) {
  var header = 'Before you can publish&hellip;',
    errorsEl = addErrors(errors),
    innerEl = document.createDocumentFragment();

  innerEl.appendChild(errorsEl);
  open(header, innerEl);
}

module.exports.close = close;
module.exports.open = open;
module.exports.openNewPage = openNewPage;
module.exports.openPublish = openPublish;
module.exports.openValidationErrors = openValidationErrors;
