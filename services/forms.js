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
 * set data for a field / group into currentData=
 * @param {object} data
 */
function setCurrentData(data) {
  var schema = data._schema;

  currentForm.data = {};

  if (schema && schema[references.fieldProperty]) {
    // this is a single field
    currentForm.data[schema._name] = edit.removeSchemaFromData(_.cloneDeep(data));
  } else {
    // this is a group of fields
    _.map(data.value, function (field) {
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
  return !_.isEqual(data, currentForm.data);
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

      // Status as editing.
      document.body.classList.add(references.editingStatus);

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
  var container, form, ref, data;

  if (isFormOpen()) {
    container = findFormContainer();
    form = container && dom.find(container, 'form');
    ref = currentForm.ref;
    data = form && formValues.get(form);

    if (dataChanged(data)) {
      // remove currentForm values
      currentForm = {};

      return edit.update(ref, data)
        .then(function () {
          removeCurrentForm(container);
          return render.reloadComponent(ref);
        })
        .then(function () {
          document.body.classList.remove(references.editingStatus); // Status as saved.
        })
        .catch(function () {
          console.warn('Did not save.');
        });
    } else {
      // Nothing changed, so do not reload.
      // but still remove currentForm values
      currentForm = {};
      removeCurrentForm(container);
      document.body.classList.remove(references.editingStatus); // Status as saved.
      return Promise.resolve();
    }
  }
}

exports.open = open;
exports.close = close;
