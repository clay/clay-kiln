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
    return formValues.cleanTextField(val);
  } else if (_.isObject(val)) {
    return removeSpacesFromData(val);
  } else {
    return val;
  }
}

/**
 * Recursively remove white spaces from all string values in the object.
 * This is necessary because form-values.js removes white spaces as well.
 * @param {{}} data
 */
function removeSpacesFromData(data) {
  return _.mapValues(data, removeSpacesFromStrings);
}

/**
 * Removes all keys that begin with "_".
 * @param {{}} data     e.g. {yes: 1, _no: 2}
 * @returns {{}}        e.g. {yes: 1}
 */
function removeMetaProperties(data) {
  return _.omit(data, function (val, key) { return _.startsWith(key, '_');});
}
/**
 * Removes all keys that begin with "_" for all objects within the object.
 * @param {{}} data     e.g. {yes: {y: 1, _n: 2}, _no: 3}
 * @returns {{}}        e.g. {yes: {y: 1}}
 */
function removeDeepMetaProperties(data) {
  return _.reduce(removeMetaProperties(data), function (result, val, key) {
    if (_.isObject(val)) {
      result[key] = removeDeepMetaProperties(val); // go deep.
    } else {
      result[key] = val;
    }
    return result;
  }, {});
}

/**
 * Check if the data vales have changed locally.
 * @param {{}} serverData   data from the server
 * @param {{}} formData     data from the form (after potential edits)
 * @returns {boolean}
 */
function dataChanged(serverData, formData) {
  var serverDataReduced = removeSpacesFromData(removeDeepMetaProperties(serverData)),
    formDataReduced = removeDeepMetaProperties(formData);

  return !_.isEqual(serverDataReduced, formDataReduced);
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

      // must clone because data object is changed by groups and formCreator -- can we change this?
      currentForm.data = _.cloneDeep(data); // set that data into the currentForm

      // get a subset of the data, for the specific field / group
      data = groups.get(ref, data, path); // note: if path is undefined, it'll open the settings form
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

// for tests:
exports.dataChanged = dataChanged;
