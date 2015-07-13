var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  formCreator = require('./form-creator'),
  edit = require('./edit'),
  formValues = require('./form-values'),
  groups = require('./groups'),
  inlineSelector = '.editor-inline',
  overlaySelector = '.editor-overlay-background',
  currentForm = {};

/**
 * Check if a form is currently open. Only one form can be open at a time.
 * @returns {boolean}
 */
function isFormOpen() {
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
 * Check if the local data is different than the data on the server.
 * @param {object} data   Edited data.
 * @returns {boolean}
 */
function dataChanged(data) {
  return !_.isEqual(data, currentForm.serverData);
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
  if (!isFormOpen()) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    return edit.getData(ref).then(function (data) {
      // set current form data
      storeServerData(path, data); // note: passing full component data into this

      // then get a subset of the data, for the specific field / group
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
 * @returns {Promise|undefined}
 */
function close() {
  var ref, container, form, data;

  if (isFormOpen()) {
    container = findFormContainer();
    form = container && dom.find(container, 'form');
    ref = currentForm.ref;
    data = form && formValues.get(form);

    // remove currentForm values
    currentForm = {};

    if (dataChanged(data)) {
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
  }
}

exports.open = open;
exports.close = close;
exports.reload = reload; // For unit tests.
