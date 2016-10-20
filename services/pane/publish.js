const _ = require('lodash'),
  moment = require('moment'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  state = require('../page-state'),
  site = require('../site'),
  tpl = require('../tpl'),
  db = require('../edit/db'),
  pane = require('./'),
  datepicker = require('../field-helpers/datepicker'),
  publishPaneController = require('../../controllers/publish-pane'),
  link = require('../deep-link'),
  kilnHideClass = 'kiln-hide';

/**
 * create actions for undoing scheduling and publishing
 * @param {object} res
 * @returns {Element}
 */
function createUndoActions(res) {
  const undo = tpl.get('.publish-undo-template');

  let unpublish, unschedule;

  // show undo actions if either are available
  if (res.scheduled || res.published) {
    dom.find(undo, '.undo').classList.remove(kilnHideClass);
  }

  // unscheduling
  if (res.scheduled) {
    state.toggleButton('scheduled', true); // just in case someone else scheduled this page
    unschedule = dom.find(undo, '.unschedule');
    if (unschedule) {
      unschedule.classList.remove(kilnHideClass);
    }
  }

  // unpublish (only affects page)
  if (res.published) {
    state.toggleButton('published', true); // just in case someone else published this page
    unpublish = dom.find(undo, '.unpublish');
    if (unpublish) {
      unpublish.classList.remove(kilnHideClass);
    }
  }

  return undo;
}

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
        itemEl = dom.create(`<li data-error-ref="${item.ref}" data-error-path="${link.getPathFromField(item.fieldName, item.data)}"><span class="error-label error-label-link">${item.label}</span>${addPreview(item.preview)}</li>`);

        itemEl.addEventListener('click', navigateToForm);
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
 * get scheduled date
 * @param {object} res
 * @param {boolean} [res.scheduled]
 * @param {string} [res.scheduledAt]
 * @returns {object|undefined}
 */
function getScheduledValues(res) {
  if (res.scheduled) {
    let at = moment(res.scheduledAt);

    return {
      date: at.format('YYYY-MM-DD'),
      time: at.format('HH:mm')
    };
  }
}

/**
 * create actions for the publish pane, depending on the state
 * @param {object} res
 * @returns {Element}
 */
function createPublishActions(res) {
  const actions = tpl.get('.publish-actions-template'),
    val = getScheduledValues(res);

  let scheduleDate, scheduleTime;

  // set date and time
  if (actions) {
    scheduleDate = dom.find(actions, '#schedule-date');
    scheduleTime = dom.find(actions, '#schedule-time');

    if (scheduleDate && val) {
      scheduleDate.setAttribute('min', val.date);
      scheduleDate.setAttribute('value', val.date);
      scheduleDate.setAttribute('placeholder', val.date);
    }

    if (scheduleTime && val) {
      scheduleTime.setAttribute('value', val.time);
      scheduleTime.setAttribute('placeholder', val.time);
    }

    // init datepicker for non-native browsers
    datepicker.init(scheduleDate, {static: true});
    datepicker.init(scheduleTime, {static: true});
  }

  return actions;
}

/**
 * create the form to set a custom url
 * @param {object} res which may contain customUrl
 * @returns {Element}
 */
function createLocationForm(res) {
  const form = tpl.get('.custom-url-form-template'),
    val = res.customUrl;

  if (val) {
    // remove the site prefix when displaying the url in the form
    // it'll be added when saving the form
    dom.find(form, '.custom-url-input').value = val.replace(db.uriToUrl(site.get('prefix')), '');
  }

  return form;
}

/**
 * open publish pane
 * @param {object} validation
 * @param {Object[]} validation.errors
 * @param {Object[]} validation.warnings
 * @returns {Promise}
 */
function openPublish(validation) {
  var pubContent = document.createDocumentFragment(),
    locationContent = document.createDocumentFragment(),
    healthContent = document.createDocumentFragment();

  return state.get().then(function (res) {
    var tabs, dynamicTab, el;

    // append publish message and actions to the doc fragment
    pubContent.appendChild(createUndoActions(res));
    pubContent.appendChild(createPublishMessages(res));
    pubContent.appendChild(createPublishActions(res));

    locationContent.appendChild(createLocationForm(res));

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
      }, {
        header: 'Location',
        content: locationContent
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
      }, {
        header: 'Location',
        content: locationContent
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

module.exports = openPublish;
_.set(window, 'kiln.services.panes.openPublish', module.exports);
