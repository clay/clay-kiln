var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  formCreator = require('./form-creator'),
  edit = require('./edit'),
  formValues = require('./form-values'),
  currentForm = {}; // Store form currently open.

/**
 * don't open the form if the current element already has an inline form open
 * @param {Element} el
 * @returns {boolean}
 */
function hasOpenInlineForms(el) {
  return !!dom.find(el, '.editor-inline');
}

/**
 * open a form
 * @param {string} ref
 * @param {Element} el
 * @param {string} path
 * @param {MouseEvent} e
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
 * if it's an inline form, replace it with the original elements
 * @param {Element} el form container, possibly inline
 */
function replaceInlineForm(el) {
  var parent = el.parentNode;

  if (el.classList.contains('editor-inline')) {
    dom.unwrapElements(parent, dom.find(parent, '.hidden-wrapped'));
  }
}

/**
 * Save the currently open form.
 * @param {Element} form
 */
function save(form) {
  var data, ref, path;

  // Save the form data prior to closing.
  if (form) {
    ref = currentForm.ref;
    path = currentForm.path;

    if (path === references.getComponentNameFromReference(ref)) {
      // we're at the top level of the component, e.g. in a settings form
      data = formValues(ref, form);
    } else {
      // only things relative to path have changed
      data = _.get(formValues(ref, form), path);
    }

    if (form.checkValidity()) {
      edit.update(ref, data, path)
        .then(function () {
          // Todo: re-render with updated HTML.
          window.location.reload();
        });
    }
  }
}

/**
 * Close and save the open form.
 * @param {Element} [el] optional element to replace (for inline forms)
 */
function close() {
  var formContainer = dom.find('.editor-overlay-background') || dom.find('.editor-inline'), // inline and overlay forms have different containers.
    form = formContainer && dom.find(formContainer, 'form');

  save(form);
  currentForm = {};
  if (formContainer) {
    replaceInlineForm(formContainer);
    dom.removeElement(formContainer);
  }
}

exports.open = open;
exports.close = close;
