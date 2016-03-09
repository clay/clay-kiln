'use strict';
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
  var messages = dom.create('<div class="messages"></div>'),
    draftMessage = dom.create('<p>In Draft.</p>'),
    effectMessage = dom.create('<p>Changes you make outside of the article will also be published.</p>');

  // add messages (in order)
  if (res.published) {
    // published message
    messages.appendChild(dom.create(`<p>Published ${state.formatTime(res.publishedAt)}</p>`)); // todo: get published time
  } else {
    messages.appendChild(draftMessage);
  }

  if (res.scheduled) {
    // scheduled message
    messages.appendChild(dom.create(`<p>Scheduled to publish ${state.formatTime(res.scheduledAt)}.</p>`));
  }

  // message about what publishing affects
  messages.appendChild(effectMessage);

  return messages;
}

/**
 * create actions for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishActions(res) {
  var today = moment().format('YYYY-MM-DD'),
    now = moment().format('HH:mm'),
    actions = dom.create('<div class="actions"></div>'),
    schedule = dom.create(`<form class="schedule">
      <label class="schedule-label" for="schedule-date">Date</label>
      <input id="schedule-date" class="schedule-input" type="date" min="${today}" value="${today}" placeholder="${today}"></input>
      <label class="schedule-label" for="schedule-time">Time</label>
      <input id="schedule-time" class="schedule-input" type="time" value="${now}" placeholder="${now}"></input>
      <button class="schedule-publish">Schedule Publish</button>
    </form>`),
    unschedule = dom.create('<button class="unschedule">Unschedule</button>'),
    publishNow = dom.create('<button class="publish-now">Publish Now</button>'),
    unpublish = dom.create('<button class="unpublish">Unpublish Page</button>');

  // add actions and buttons (in order)
  // scheduling: always exists
  actions.appendChild(schedule);

  // unscheduling
  if (res.scheduled) {
    state.toggleScheduled(true); // just in case someone else scheduled this page
    actions.appendChild(unschedule);
  }

  // publish: always exists
  actions.appendChild(publishNow);

  // unpublish (only affects page)
  if (res.published) {
    actions.appendChild(unpublish);
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
    messageEl = dom.create(`
      <div class="error-message">This page is missing things needed to publish.<br />Address the following and try publishing again.</div>
    `),
    errorsEl = addErrors(errors),
    innerEl = document.createDocumentFragment();

  innerEl.appendChild(messageEl);
  innerEl.appendChild(errorsEl);

  open(header, innerEl);
}

module.exports.close = close;
module.exports.open = open;
module.exports.openPublish = openPublish;
module.exports.openValidationErrors = openValidationErrors;
