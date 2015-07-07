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
 * don't open the form if the current element already has an inline form open
 * @param {Element} el  The editable element
 * @returns {boolean}
 */
function hasOpenInlineForms(el) {
  return !!dom.find(el, '.editor-inline');
}

/**
 * Check if data is top level of the component. e.g. Top level when in a settings form
 * @param {string} ref
 * @param {string} path
 * @returns {boolean}
 */
function isTopLevel(ref, path) {
  return path === references.getComponentNameFromReference(ref);
}

/**
 * Find the form container.
 */
function findFormContainer() {
  return dom.find(overlaySelector) || dom.find(inlineSelector);
}

/**
 * Get the current form's data.
 */
function getFormData(form, ref, path) {
  var data = formValues.get(ref, form);

  if (!isTopLevel(ref, path)) {
    data = _.get(data, path);
  }
  return data;
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
 * Reload page. Disabled during unit tests.
 */
function reload() {
  window.location.reload();
}

/**
 * Save the current form.
 * @param {Element} form
 * @param {string} ref
 * @param {string} path
 * @param {object} data
 */
function save(form, ref, path, data) {
  if (form && form.checkValidity()) {
    edit.update(ref, data, path)
      .then(function () {
        // Todo: re-render with updated HTML.
        module.exports.reload();
      });
  }
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
 * Store the data from the server to compare for changes.
 * @param {string} ref
 * @param {string} path
 * @param {object} data
 */
function storeServerData(ref, path, data) {
  var dataOnly = edit.removeSchemaFromData(_.cloneDeep(data));

  currentForm.serverData = isTopLevel(ref, path) ? dataOnly : _.get(dataOnly, path);
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
  // first, check to make sure any inline forms aren't open in this element's children
  if (!hasOpenInlineForms(el)) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    currentForm = {
      ref: ref,
      path: path
    };
    return edit.getData(ref).then(function (data) {
      storeServerData(ref, path, data);
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
 */
function close() {
  var ref = currentForm.ref,
    path = currentForm.path,
    container = findFormContainer(),
    form = container && dom.find(container, 'form'),
    data = form && getFormData(form, ref, path);


  if (dataChanged(data)) {
    save(form, ref, path, data);
  }
  if (container) {
    replaceInlineForm(container);
    dom.removeElement(container);
  }
  currentForm = {};
}

exports.open = open;
exports.close = close;
exports.reload = reload; // For unit tests.
