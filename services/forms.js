var _ = require('lodash'),
  behaviors = require('./behaviors'),
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
 * Tests if the field has an affects behavior.
 * @param {object} field
 * @returns {boolean}
 */
function hasAffects(field) {
  var props = _.get(field, '_schema.' + references.fieldProperty),
    bs = props && behaviors.getExpandedBehaviors(props);

  return !!_.find(bs, references.behaviorKey, 'affects');
}

/**
 * Saves the value of the field to the currentForm data.
 * @param {object} field
 */
function setCurrentFormFieldValue(field) {
  var name = _.get(field, '_schema._name'),
    value = field.hasOwnProperty('value') ? field.value : field;

  currentForm.data[name] = value;
}

/**
 * set data for a field / group into currentForm
 * @param {object} data
 */
function setCurrentData(data) {
  var fields,
    isSingleField = !!_.get(data, '_schema.' + references.fieldProperty);

  currentForm.data = {}; // clear form.
  fields = isSingleField ? [data] : data.value; // ensure fields is an array.
  _.reject(fields, hasAffects).forEach(setCurrentFormFieldValue); // ignore "affects" fields and set current.
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
      setCurrentData(data); // set that data into the currentForm

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

    if (data && dataChanged(data)) { // data is null if the component was removed.
      // remove currentForm values
      currentForm = {};

      data[references.referenceProperty] = ref;
      return edit.toClayKilnStyle(data, {isPartial: true})
        .then(edit.savePartial)
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
