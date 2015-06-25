var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  formCreator = require('./form-creator'),
  edit = require('./edit');

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
    }

    return edit.getData(ref).then(function (data) {
      // If name, then we're going deep; Note anything with a name either modal by default or has a displayProperty.
      if (path) {
        data = _.get(data, path);
      }

      switch (data._schema[references.displayProperty]) {
        case 'inline':
          return formCreator.createInlineForm(ref, path, data, el);
        default: // case 'modal':
          return formCreator.createForm(ref, path, data);
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
 * close the open form
 * @param {Element} [el] optional element to replace (for inline forms)
 */
function close() {
  var formContainer = dom.find('.editor-modal-overlay') || dom.find('.editor-inline');

  // todo: when we have autosave, this is a point where it should save

  if (formContainer) {
    replaceInlineForm(formContainer);
    dom.removeElement(formContainer);
  }
}

exports.open = open;
exports.close = close;
