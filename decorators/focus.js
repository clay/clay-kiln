var _ = require('lodash'),
  references = require('../services/references'),
  forms = require('../services/forms'),
  select = require('../services/select'),
  sr = require('selection-range'),
  dom = require('@nymag/dom'),
  helpers = require('../services/field-helpers'),
  currentFocus;

/**
 * get the text offset from a click event
 * @param {MouseEvent} e
 * @returns {number}
 */
function getClickOffset(e) {
  var parentText = '';
  let range, textNode, offset, parent, parentOffset;

  try {
    if (document.caretPositionFromPoint) {
      range = document.caretPositionFromPoint(e.clientX, e.clientY);
      textNode = range.offsetNode;
      offset = range.offset;
    } else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
      textNode = range.startContainer;
      offset = range.startOffset;
    }

    parent = dom.closest(textNode, '[data-uri]'); // get component el

    // if we are actually clicking on a placeholder (not real data), just return 0
    if (dom.find(parent, '.kiln-placeholder') || dom.find(parent, '.kiln-permanent-placeholder')) {
      return 0;
    }

    // grab all the text that isn't in the selector
    // e.g. regular textnodes, formatted stuff
    _.each(parent.childNodes, function (node) {
      // if it's a text node (type is 3) or ISN'T the component selector, grab the text
      if (!node.classList || !node.classList.contains('component-selector')) {
        parentText += node.textContent;
      }
    });
    // otherwise try to get the full offset from the parent
    parentOffset = parentText.trim().indexOf(textNode.textContent) + offset;

    return parentOffset;
  } catch (e) {
    return 0; // if we can't find the offset, or anything breaks, just return 0;
  }
}

/**
 * set caret on inline forms
 * @param {Element} field
 * @param {number} offset
 * @param {Element} form
 */
function setCaretInline(field, offset, form) {
  // only set caret if it's an inline form AND there's an actual offset
  if (form.classList.contains('editor-inline') && offset > 0) {
    sr(field, { start: offset });
  }
}

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
    currentFocus = null;
    return forms.close();
  } else {
    return Promise.reject();
  }
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
      var offset = getClickOffset(e);

      select.select(el);
      currentFocus = el;
      return forms.open(options.ref, el, options.path, e).then(function (formEl) {
        var firstField = helpers.getField(formEl),
          firstFieldInput;

        // focus on the first field in the form we just created
        if (firstField && helpers.isInput(firstField)) {
          // first field is itself an input
          firstField.focus();
          setCaretInline(firstField, offset, formEl);
        } else if (firstField) {
          firstFieldInput = helpers.getInput(firstField);
          // first field is a list or something, that contains an input as a child
          if (firstFieldInput) {
            firstFieldInput.focus();
            setCaretInline(firstFieldInput, offset, formEl);
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
  isComponentList = !!schema && schema.hasOwnProperty(references.componentListProperty);

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
