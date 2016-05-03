var _ = require('lodash'),
  moment = require('moment'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  state = require('./page-state'),
  site = require('./site'),
  paneController = require('../controllers/pane'),
  newPagePaneController = require('../controllers/pane-new-page'),
  publishPaneController = require('../controllers/publish-pane'),
  kilnHideClass = 'kiln-hide';

/**
 * grab templates from the dom
 * @param {string} selector
 * @returns {Element}
 */
function getTemplate(selector) {
  var template = dom.find(selector);

  return document.importNode(template.content, true);
}

/**
 * create pane
 * @param {string} header
 * @param {Element|DocumentFragment} innerEl
 * @returns {Element}
 */
function createPane(header, innerEl) {
  var el = exports.getTemplate('.kiln-pane-template');

  // add header and contents
  el.querySelector('.pane-header').innerHTML = header;
  el.querySelector('.pane-inner').appendChild(innerEl);

  return el;
}

/**
 * close an open pane
 */
function close() {
  var pane = dom.find('.kiln-toolbar-pane-background');

  if (pane) {
    dom.removeElement(pane);
  }
}

/**
 * open a pane
 * @param {string} header will display at the top of the pane, html accepted
 * @param {Element} innerEl will display inside the pane
 * @param {string} [modifier] optional css class name for modifying the pane
 * @returns {Element} pane
 */
function open(header, innerEl, modifier) {
  var toolbar = dom.find('.kiln-toolbar'),
    el = createPane(header, innerEl),
    pane, paneWrapper;

  close(); // close any other panes before opening a new one
  dom.insertBefore(toolbar, el);
  paneWrapper = toolbar.previousElementSibling; // now grab a reference to the dom
  // init controller for pane background
  ds.controller('paneWrapper', paneController);
  ds.get('paneWrapper', paneWrapper);
  // trick browser into doing a repaint, to force the animation
  setTimeout(function () {
    pane = dom.find(paneWrapper, '.kiln-toolbar-pane');
    pane.classList.add('on');
    if (modifier) {
      pane.classList.add(modifier);
    }
  }, 0);
  return paneWrapper;
}

/**
 * create validation messages
 * @param {array} [warnings]
 * @returns {Element}
 */
function createPublishValidation(warnings) {
  if (warnings.length) {
    let el = document.createDocumentFragment(),
      messageEl = exports.getTemplate('.publish-warning-message-template'),
      // same way the error pane does it
      errorsEl = addErrors(warnings, 'publish-warning');

    el.appendChild(messageEl);
    el.appendChild(errorsEl);

    return el;
  } else {
    return exports.getTemplate('.publish-valid-template');
  }
}

/**
 * create messages for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishMessages(res) {
  var messages = exports.getTemplate('.publish-messages-template'),
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
      scheduleMessage.classList.remove(kilnHideClass);
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
  const actions = exports.getTemplate('.publish-actions-template'),
    today = moment().format('YYYY-MM-DD'),
    now = moment().format('HH:mm');
  let scheduleDate, scheduleTime, unpublish, unschedule;

  // set date and time
  if (actions) {
    scheduleDate = dom.find(actions, '#schedule-date');
    scheduleTime = dom.find(actions, '#schedule-time');

    if (scheduleDate) {
      scheduleDate.setAttribute('min', today);
      scheduleDate.setAttribute('value', today);
      scheduleDate.setAttribute('placeholder', today);
    }

    if (scheduleTime) {
      scheduleTime.setAttribute('value', now);
      scheduleTime.setAttribute('placeholder', now);
    }
  }

  // unscheduling
  if (res.scheduled) {
    state.toggleScheduled(true); // just in case someone else scheduled this page
    unschedule = dom.find(actions, '.unschedule');
    if (unschedule) {
      unschedule.classList.remove(kilnHideClass);
    }
  }

  // unpublish (only affects page)
  if (res.published) {
    unpublish = dom.find(actions, '.unpublish');
    if (unpublish) {
      unpublish.classList.remove(kilnHideClass);
    }
  }

  return actions;
}

/**
 * open publish pane
 * @param {array} [warnings]
 * @returns {Promise}
 */
function openPublish(warnings) {
  var header = 'Schedule Publish',
    innerEl = document.createDocumentFragment(),
    el;

  return state.get().then(function (res) {
    // append validation, message, and actions to the doc fragment
    innerEl.appendChild(createPublishValidation(warnings));
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
 * open new page type dialog pane
 * note: not a promise
 */
function openNewPage() {
  var header = 'New Page',
    innerEl = document.createDocumentFragment(),
    pageActionsSubTemplate = exports.getTemplate('.new-page-actions-template'),
    el;

  // append actions to the doc fragment
  innerEl.appendChild(pageActionsSubTemplate);
  // create the root pane element
  el = open(header, innerEl, 'medium');
  // init controller for publish pane
  ds.controller('pane-new-page', newPagePaneController);
  ds.get('pane-new-page', el.querySelector('.actions'));
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
 * @param {Object[]} errors (or warnings)
 * @param {string} [modifier] modifier class for warnings, info, etc
 * @returns {Element}
 */
function addErrors(errors, modifier) {
  return _.reduce(errors, function (el, error) {
    var errorEl = exports.getTemplate('.publish-errors-template'),
      errorLabel = dom.find(errorEl, '.label'),
      errorDescription = dom.find(errorEl, '.description'),
      list = dom.find(errorEl, '.errors');

    // add rule label if it exists
    if (errorLabel && _.get(error, 'rule.label')) {
      errorLabel.innerHTML = error.rule.label + ':';
    }

    // add rule description if it exists
    if (errorDescription && _.get(error, 'rule.description')) {
      errorDescription.innerHTML = error.rule.description;
    }

    // add each place where the error/warning occurs
    _.each(error.errors, function (item) {
      var itemEl = dom.create(`<li><span class="error-label">${item.label}</span>${addPreview(item.preview)}</li>`);

      list.appendChild(itemEl);
    });

    el.appendChild(errorEl);
    // add modifier class if it exists
    if (modifier) {
      dom.find(el, '.publish-error').classList.add(modifier);
    }
    return el;
  }, document.createDocumentFragment());
}

/**
 * open validation error pane
 * @param {object} validation
 * @param {Object[]} validation.errors
 * @param {Object[]} validation.warnings
 */
function openValidationErrors(validation) {
  var header = 'Before you can publish&hellip;',
    messagesEl = exports.getTemplate('.publish-error-message-template'),
    errorsEl = addErrors(validation.errors),
    warningsEl = addErrors(validation.warnings, 'publish-warning'),
    innerEl = document.createDocumentFragment();

  innerEl.appendChild(messagesEl);
  innerEl.appendChild(errorsEl);
  innerEl.appendChild(warningsEl);
  open(header, innerEl);
}

function takeOffEveryZig() {
  var header = '<span class="ayb-header">HOW ARE YOU GENTLEMEN <em>!!</em></span>',
    messageEl = dom.create(`
      <img class="cats-ayb" src="${site.get('assetPath')}/media/components/clay-kiln/cats.png" />
      <div class="error-message ayb">ALL YOUR BASE ARE BELONG TO US</div>
    `),
    errorsEl = dom.create(`<div class="publish-error">
      <div class="label">YOU ARE ON THE WAY TO DESTRUCTION</div>
      <div class="description ayb">YOU HAVE NO CHANCE TO SURVIVE MAKE YOUR TIME</div>
    </div>`),
    innerEl = document.createDocumentFragment();

  innerEl.appendChild(messageEl);
  innerEl.appendChild(errorsEl);

  open(header, innerEl);
}

module.exports.getTemplate = getTemplate;
module.exports.close = close;
module.exports.open = open;
module.exports.openNewPage = openNewPage;
module.exports.openPublish = openPublish;
module.exports.openValidationErrors = openValidationErrors;
module.exports.takeOffEveryZig = takeOffEveryZig;
