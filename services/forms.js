var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  formCreator = require('./form-creator'),
  edit = require('./edit'),
  render = require('./render'),
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
 * Removes everything except the value.
 * @param {object} data
 * @returns {*}
 */
function cloneValueOnly(data) {
  return _.cloneDeep(data && data.value);
}

/**
 * Tests if the field has an affects field.
 * @param {object} field
 * @returns {boolean}
 */
function hasAffects(field) {
  var behaviors = _.get(field, '_schema._has');

  return !!(behaviors && _.find(behaviors, {fn: 'affects'}));
}

/**
 * set data for a field / group into currentData=
 * @param {object} data
 */
function setCurrentData(data) {
  var schema = data._schema;

  currentForm.data = {};

  if (schema && schema[references.fieldProperty]) {
    // this is a single field
    currentForm.data[schema._name] = cloneValueOnly(data);
  } else {
    // this is a group of fields
    _.reject(data.value, hasAffects).map(function (field) {
      var name = _.get(field, '_schema._name'),
        value = field.hasOwnProperty('value') ? field.value : field;

      currentForm.data[name] = value;
    });
  }
}

/**
 * Check if the local data is different than the data on the server.
 * @param {object} data   Edited data.
 * @returns {boolean}
 */
function dataChanged(data) {
  return !_.isMatch(data, currentForm.data); // data may have "affects" fields so not _.isEqual.
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
 * Add the editing class to the document body.
 * @param {boolean} isEditing
 */
function setEditingStatus(isEditing) {
  var classList = document.body.classList,
    editingStatusClass = references.editingStatus;

  if (isEditing) {
    classList.add(editingStatusClass);
  } else {
    classList.remove(editingStatusClass);
  }
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
      currentForm = {
        ref: ref,
        path: path
      };

      // then get a subset of the data, for the specific field / group
      data = groups.get(ref, data, path); // note: if path is undefined, it'll open the settings form
      setCurrentData(data); // set that data into the currentForm

      setEditingStatus(true); // Status as editing.

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
  var container, form, ref, data;

  if (isFormOpen()) {
    container = findFormContainer();
    form = container && dom.find(container, 'form');
    ref = currentForm.ref;
    data = form && formValues.get(form);

    if (data && dataChanged(data)) { // data is null if the component was removed.
      // remove currentForm values
      currentForm = {};

      return edit.update(ref, data)
        .then(function () {
          removeCurrentForm(container);
          return render.reloadComponent(ref);
        })
        .then(function () {
          setEditingStatus(false); // Status as saved.
        })
        .catch(function () {
          console.warn('Did not save.');
        });
    } else {
      // Nothing changed or the component was removed, so do not reload.
      // but still remove currentForm values
      currentForm = {};
      removeCurrentForm(container);
      setEditingStatus(false); // Status as saved.
    }
  }
  return Promise.resolve();
}

exports.open = open;
exports.close = close;
