var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  formCreator = require('./form-creator'),
  edit = require('./edit'),
  formValues = require('./form-values'),
  groups = require('./groups'),
  inlineSelector = '.editor-inline',
  overlaySelector = '.editor-overlay-background',
  isFormOpen = false;

/**
 * Find the form container.
 * @returns {Element}
 */
function findFormContainer() {
  return dom.find(overlaySelector) || dom.find(inlineSelector);
}

/**
 * Check if the local data is different than the data on the server.
 * @param {string} ref
 * @param {object} data   Edited data.
 * @returns {Promise}
 */
function dataChanged(ref, data) {
  return edit.getData(ref).then(function (oldData) {
    oldData = edit.removeSchemaFromData(oldData);
    return !_.isEqual(data, oldData);
  });
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
 * Remove the form element
 * @param {Element} container
 */
function removeCurrentForm(container) {
  if (container) {
    replaceInlineForm(container);
    dom.removeElement(container);
  }
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
 * @param {string} [path]
 * @param {MouseEvent} [e]
 * @return {Promise|undefined}
 */
function open(ref, el, path, e) {
  if (!isFormOpen) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // set isFormOpen
    isFormOpen = true;

    return edit.getData(ref).then(function (data) {
      data = groups.get(ref, data, path); // note: if path is undefined, it'll open the settings form

      if (data._schema[references.displayProperty] === 'inline') {
        return formCreator.createInlineForm(ref, data, el);
      } else {
        return formCreator.createForm(ref, data);
      }
    });
  }
}

/**
 * Close and save the open form.
 * @returns {Promise}
 */
function close() {
  var ref, container, form, data;

  if (isFormOpen) {
    container = findFormContainer();
    form = container && dom.find(container, 'form');
    ref = form && form.getAttribute('data-form-ref');
    data = form && formValues.get(form);

    // set isFormOpen
    isFormOpen = false;

    return dataChanged(ref, data).then(function (hasChanged) {
      if (hasChanged) {
        return edit.update(ref, data)
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
    });
  } else {
    return Promise.resolve();
  }
}

exports.open = open;
exports.close = close;
exports.reload = reload; // For unit tests.
