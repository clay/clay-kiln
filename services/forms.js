var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  formCreator = require('./form-creator'),
  edit = require('./edit'),
  formValues = require('./form-values'),
  currentForm = {}, // Store form currently open, as only one form can be open at a time.
  inlineSelector = '.editor-inline',
  overlaySelector = '.editor-overlay-background';

/**
 * Check if a form is currently open. Only one form can be open at a time.
 * @returns {boolean}
 */
function formIsOpen() {
  return !!currentForm.ref;
}

/**
 * Find the form container.
 * @returns {Element}
 */
function findFormContainer() {
  return dom.find(overlaySelector) || dom.find(inlineSelector);
}

/**
 * Get the current form's data.
 * @param {Element} form
 * @param {string} ref
 * @param {string} path
 * @returns {Object}
 */
function getFormData(form, ref, path) {
  return _.get(formValues.get(ref, form), path);
}

/**
 * Store the data from the server to compare for changes.
 * @param {string} path
 * @param {object} data
 */
function storeServerData(path, data) {
  var dataOnly = edit.removeSchemaFromData(_.cloneDeep(data));

  currentForm.serverData = _.get(dataOnly, path);
}

/**
 * Check if the local data is different than the data on the server.
 * @param {object} data   Edited data.
 * @returns {boolean}
 */
function dataChanged(data) {
  return !_.isEqual(data, currentForm.serverData);
}

/**
 * if it's an inline form, replace it with the original elements
 * @param {Element} el  form container, possibly inline
 */
function replaceInlineForm(el) {
  var parent = el.parentNode;

  if (el.classList.contains('editor-inline')) {
    dom.unwrapElements(parent, dom.find(parent, '.hidden-wrapped'));
  }
}

/**
 * Remove the form element and clear the currentForm object.
 * @param {Element} container
 */
function removeCurrentForm(container) {
  if (container) {
    replaceInlineForm(container);
    dom.removeElement(container);
  }
  currentForm = {};
}

/**
 * Reload page. Disabled during unit tests.
 */
function reload() {
  window.location.reload();
}

/**
 * Open a form.
 * @param {string} ref
 * @param {Element} el    The element that has `data-editable`, not always the parent of the form.
 * @param {string} path
 * @param {MouseEvent} [e]
 * @return {Promise|undefined}
 */
function open(ref, el, path, e) {
  if (!formIsOpen()) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    currentForm = {
      ref: ref,
      path: path
    };
    return edit.getData(ref).then(function (data) {
      storeServerData(path, data);
      if (path) {
        data = _.get(data, path);
        if (data._schema[references.displayProperty] === 'inline') {
          // inline forms have a path and _display: inline
          return formCreator.createInlineForm(ref, path, data, el);
        } else {
          // overlay forms have a path and are the default
          formCreator.createForm(ref, path, data);
        }
      } else {
        // settings forms don't have a path, since they're operating on the whole component
        return formCreator.createSettingsForm(ref, data);
      }
    });
  }
}

/**
 * Close and save the open form.
 * @returns {Promise}
 */
function close() {
  return Promise.resolve((function () {
    var ref, path, container, form, data;

    if (formIsOpen()) {
      ref = currentForm.ref;
      path = currentForm.path;
      container = findFormContainer();
      form = container && dom.find(container, 'form');
      data = form && getFormData(form, ref, path);

      if (dataChanged(data)) {
        return edit.update(ref, data, path)
          .then(function () {
            removeCurrentForm(container);
            // Todo: don't reload the entire page.
            module.exports.reload();
          })
          .catch(function () {
            console.warn('Did not save.');
          });
      } else {
        // Nothing changed, so do not reload.
        removeCurrentForm(container);
      }
    }
  }()));
}

exports.open = open;
exports.close = close;
exports.reload = reload; // For unit tests.
