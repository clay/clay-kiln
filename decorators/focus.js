var _ = require('lodash'),
  references = require('../services/references'),
  forms = require('../services/forms'),
  select = require('../services/select'),
  dom = require('../services/dom'),
  getInput = require('../services/get-input'),
  componentList = require('./component-list'),
  currentFocus;

function hasCurrentFocus() {
  return !!currentFocus;
}

/**
 * remove focus
 * @returns {Promise}
 */
function unfocus() {
  if (forms.isFormValid()) {
    select.unselect();
    componentList.closePanes(); // close any open add-component panes
    currentFocus = null;
    return forms.close();
  } else {
    return Promise.reject();
  }
}

/**
 * focus on an input / contenteditable element,
 * setting caret to the end
 * @param {Element} input
 */
function focusFirstInput(input) {
  var range, selection;

  // first, focus the input
  input.focus();
  // then summon the Old Ones
  range = document.createRange();
  selection = window.getSelection();
  range.setStart(div, 1);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  // now we have clawed back the thin skein of reality and beheld the horrors beneath
}

/**
 * set focus on an Element
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @param {MouseEvent} e
 * @returns {Promise}
 */
function focus(el, options, e) {
  var publishPane = dom.find('.kiln-publish-pane');

  // if the publish pane is showing, hide it
  if (publishPane) {
    publishPane.classList.remove('show');
  }

  return unfocus() // unfocus the potentialy-opened current form first
    .then(function () {
      select.select(el);
      currentFocus = el;
      return forms.open(options.ref, el, options.path, e).then(function () {
        var firstField = dom.find('[' + references.fieldAttribute + ']'),
          firstFieldInput;

        // focus on the first field in the form we just created
        if (firstField && getInput.isInput(firstField)) {
          // first field is itself an input
          firstField.focus();
        } else if (firstField) {
          firstFieldInput = getInput(firstField);
          // first field is a list or something, that contains an input as a child
          if (firstFieldInput) {
            focusFirstInput(firstFieldInput);
          }
        }

        return firstField;
      });
    }).catch(_.noop); // form didn't close for some reason.
    // usually because native validation failed
}

/**
 * only add focus decorator (e.g. click events) if it's NOT a component list
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function when(el, options) {
  var schema, isEditable, isComponentList;

  schema = _.get(options, 'data._schema');
  isEditable = el.hasAttribute(references.editableAttribute);
  isComponentList = schema.hasOwnProperty(references.componentListProperty);

  return isEditable && !isComponentList;
}

/**
 * add click event that generates a form
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  el.addEventListener('click', function (e) {
    if (el !== currentFocus) {
      exports.focus(el, options, e);
    } else {
      e.stopPropagation();
    }
  });
  return el;
}

// focus and unfocus
module.exports.hasCurrentFocus = hasCurrentFocus;
module.exports.focus = focus;
module.exports.unfocus = unfocus;

// decorators
module.exports.when = when;
module.exports.handler = handler;
