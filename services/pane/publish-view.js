import _ from 'lodash';

const dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  state = require('../page-state'),
  tpl = require('../tpl'),
  pane = require('./'),
  publishPaneController = require('../../controllers/publish-pane'),
  link = require('../deep-link'),
  toggleEdit = require('../toggle-edit'),
  kilnHideClass = 'kiln-hide';

/**
 * add error preview, e.g. excerpt of the data that contains errors
 * @param {string} preview
 * @returns {string}
 */
function addPreview(preview) {
  if (preview) {
    return `<span class="error-preview">${preview}</span>`;
  } else {
    return '';
  }
}

/**
 * navigate to form when clicking validation errors
 * note: only works for validation errors that link to a specific form
 * @param {Event} e
 * @returns {Promise}
 */
function navigateToForm(e) {
  const el = e.currentTarget,
    ref = el.getAttribute('data-error-ref'),
    path = el.getAttribute('data-error-path');

  // stop click from propagating up and closing the form right after we open it
  e.stopPropagation();

  pane.close();
  return link.navigate(ref, path, e);
}

/**
 * format and assemble error messages
 * @param {Object[]} errors (or warnings)
 * @param {string} [modifier] modifier class for warnings, info, etc
 * @returns {Element}
 */
function addErrorsOrWarnings(errors, modifier) {
  return _.reduce(errors, function (el, error) {
    var errorEl = tpl.get('.publish-errors-template'),
      errorLabel = dom.find(errorEl, '.label'),
      labelVal = _.get(error, 'rule.label'),
      descVal = _.get(error, 'rule.description'),
      errorDescription = dom.find(errorEl, '.description'),
      list = dom.find(errorEl, '.errors');

    // add rule label if it exists
    if (errorLabel) {
      errorLabel.innerHTML = labelVal ? `${labelVal}:` : 'There was a problem:';
      // note the colon after the label, hence using a ternary operator
    }

    // add rule description if it exists
    if (errorDescription) {
      errorDescription.innerHTML = descVal || 'Please see below for details';
    }

    // add each place where the error/warning occurs
    _.each(error.errors, function (item) {
      let itemEl;

      if (item.fieldName && item.data) {
        // add a link to open the specific form to update the data
        itemEl = dom.create(`<li><button class="error-button" data-error-ref="${item.ref}" data-error-path="${link.getPathFromField(item.fieldName, item.data)}"><span class="error-label error-label-link">${item.label}</span></button>${addPreview(item.preview)}</li>`);

        itemEl.firstElementChild.addEventListener('click', navigateToForm);
      } else {
        // don't add any link
        itemEl = dom.create(`<li><span class="error-label">${item.label}</span>${addPreview(item.preview)}</li>`);
      }

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
 * create validation messages
 * @param {object} validation
 * @returns {Element}
 */
function createPublishValidation(validation) {
  var errors = validation.errors,
    warnings = validation.warnings;

  if (errors.length) {
    let el = document.createDocumentFragment(),
      messagesEl = tpl.get('.publish-error-message-template'),
      errorsEl = addErrorsOrWarnings(errors),
      warningsEl = addErrorsOrWarnings(warnings, 'publish-warning');

    el.appendChild(messagesEl);
    el.appendChild(errorsEl);
    el.appendChild(warningsEl);

    return el;
  } else if (warnings.length) {
    let el = document.createDocumentFragment(),
      messageEl = tpl.get('.publish-warning-message-template'),
      // same way the error pane does it
      errorsEl = addErrorsOrWarnings(warnings, 'publish-warning');

    el.appendChild(messageEl);
    el.appendChild(errorsEl);

    return el;
  } else {
    return tpl.get('.publish-valid-template');
  }
}

/**
 * create the health dynamic pane header
 * @param {object} validation
 * @returns {string}
 */
function createHealthHeader(validation) {
  var header = tpl.get('.health-header-template'),
    errors = validation.errors,
    warnings = validation.warnings;

  if (errors.length) {
    dom.find(header, '.errors').classList.remove(kilnHideClass);
  } else if (warnings.length) {
    dom.find(header, '.warnings').classList.remove(kilnHideClass);
  } else {
    dom.find(header, '.valid').classList.remove(kilnHideClass);
  }

  return header.firstElementChild.innerHTML;
}

/**
 * create messages for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishMessages(res) {
  var messages = tpl.get('.publish-messages-template'),
    scheduleMessage, stateMessage;

  messages.firstElementChild.classList.add('view-mode');

  if (res.published) {
    stateMessage = dom.find(messages, '.publish-state-message');
    if (stateMessage && res.publishedAt) {
      stateMessage.innerHTML = `Published ${state.formatTime(res.publishedAt)}.`;
    } else if (stateMessage) {
      stateMessage.innerHTML = 'Page is currently published.';
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
 * create edit button and message
 * @returns {Element}
 */
function createEditButton() {
  var el = dom.create(`<div class="publish-edit-section">
    <p class="publish-edit-message">For more information, click <em>Edit Page</em>.</p>
    <button class="publish-edit-toggle">Edit Page</button>
    </div>`);

  dom.find(el, '.publish-edit-toggle').addEventListener('click', toggleEdit);
  return el;
}

/**
 * open publish pane
 * @param {object} validation
 * @param {Object[]} validation.errors
 * @param {Object[]} validation.warnings
 * @returns {Promise}
 */
function openPublishView(validation) {
  var pubContent = document.createDocumentFragment(),
    healthContent = document.createDocumentFragment();

  return state.get().then(function (res) {
    var tabs, dynamicTab, el;

    // append publish message and actions to the doc fragment
    pubContent.appendChild(createPublishMessages(res));
    pubContent.appendChild(createEditButton());

    // add dynamic pane with validation
    healthContent.appendChild(createPublishValidation(validation));

    // if there are errors, make the health tab active when the pane opens
    // and disable the publish tab
    if (_.get(validation, 'errors.length')) {
      // publish is disabled
      tabs = [{
        header: 'Publish',
        content: pubContent,
        disabled: true
      }];
      dynamicTab = {
        header: createHealthHeader(validation),
        content: healthContent,
        active: true // health tab is active when pane opens
      };
    } else {
      tabs = [{
        header: 'Publish',
        content: pubContent,
        active: true // publish tab is active when pane opens
      }];
      dynamicTab = {
        header: createHealthHeader(validation),
        content: healthContent
      };
    }

    // create pane!
    el = pane.open(tabs, dynamicTab);

    // init controller for publish pane
    ds.controller('publish-pane', publishPaneController);
    ds.get('publish-pane', el);
  });
}

module.exports = openPublishView;
_.set(window, 'kiln.services.panes.openPublishView', module.exports);
