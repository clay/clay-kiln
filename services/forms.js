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
  currentForm = {}; // used to track if changes have been made.

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
 * Check if the data has changed locally.
 * @param {{}} serverData   data from the server
 * @param {{}} formData     data from the form (after potential edits)
 * @returns {boolean}
 */
function dataChanged(serverData, formData) {
  console.log('serverData', serverData);
  console.log('formData', formData);
  console.log('currentForm.ref', currentForm.ref);
  console.log('currentForm.path', currentForm.path);

  return !_.contains(serverData, formData);
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
 * If the val is a string, then remove white spaces.
 * @param {*} val
 */
function removeSpacesFromStrings(val) {
  if (_.isString(val)) {
    // todo: this text formatting should share a function with form-values to keep them in-sync if there are future changes.
    return val.replace(/(\u00a0|&#160;|&nbsp;)/g, ' ').trim(); // remove &nbsp; to be consistent with form-values.js
  } else if (_.isObject(val)) {
    return removeSpacesFromData(val);
  } else {
    return val;
  }
}

/**
 * Recursively remove white spaces from all string values in the object.
 * @param {{}} data
 */
function removeSpacesFromData(data) {
  return _.mapValues(data, removeSpacesFromStrings);
}

/**
 * Set the data to be compared later for form changes.
 * @param {{}} data
 */
function setCurrentFormData(data) {
  currentForm.data = removeSpacesFromData(_.cloneDeep(data));
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
  // first, check if a form is already open
  if (!isFormOpen()) {
    if (e) {
      // if there's a click event, stop it from bubbling up or doing weird things
      e.stopPropagation();
      e.preventDefault();
    }

    // grab the (possibly cached) data and create the form
    return edit.getData(ref).then(function (data) {
      // set current form data
      currentForm = {
        ref: ref,
        path: path
      };

      // then get a subset of the data, for the specific field / group
      data = groups.get(ref, data, path); // note: if path is undefined, it'll open the settings form
      setCurrentFormData(data);// set that data into the currentForm
      setEditingStatus(true); // set editing status (a class on the <body> of the page)

      // determine if the form is inline, and call the relevant formCreator method
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

    if (data && dataChanged(currentForm.data, data)) { // data is null if the component was removed.

      console.log('Data "changed".');

      // remove currentForm values
      currentForm = {};

      data[references.referenceProperty] = ref;
      return edit.savePartial(data)
        .then(function () {
          removeCurrentForm(container);
          return render.reloadComponent(ref);
        }).then(function () {
          setEditingStatus(false); // Status as saved.
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

// for unit tests:
exports.dataChanged = dataChanged;
