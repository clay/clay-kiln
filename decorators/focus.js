var _ = require('lodash'),
  references = require('../services/references'),
  forms = require('../services/forms'),
  select = require('../services/select'),
  dom = require('../services/dom'),
  currentFocus; // eslint-disable-line

function hasCurrentFocus() {
  return !!currentFocus;
}

/**
 * remove focus
 * @returns {Promise}
 */
function unfocus() {
  select.unselect();
  currentFocus = null;
  return forms.close();
}

/**
 * set focus on an Element
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @param {MouseEvent} e
 * @returns {Promise}
 */
function focus(el, options, e) {
  return unfocus() // unfocus the potentialy-opened current form first
    .then(function () {
      select.select(el);
      currentFocus = el;
      return forms.open(options.ref, el, options.path, e).then(function () {
        var firstField = dom.find('[' + references.fieldAttribute + ']');

        // focus on the first field in the form we just created
        if (firstField) {
          firstField.focus();
        }

        return firstField;
      });
    });
}

/**
 * only add focus decorator (e.g. click events) if it's NOT a component list
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function when(el, options) {
  var schema = _.get(options, 'data._schema'),
    isEditable = el.hasAttribute(references.editableAttribute),
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
