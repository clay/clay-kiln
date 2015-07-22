var _ = require('lodash'),
  references = require('../services/references'),
  forms = require('../services/forms'),
  select = require('../services/select'),
  dom = require('../services/dom'),
  currentFocus; // eslint-disable-line

/**
 * remove focus
 */
function unfocus() {
  select.unselect();
  currentFocus = null;
  forms.close();
}

/**
 * set focus on an Element
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @param {MouseEvent} e
 * @returns {Promise|undefined}
 */
function focus(el, options, e) {
  unfocus(); // unfocus the potentialy-opened current form first
  select.select(el);
  currentFocus = el;
  return forms.open(options.ref, el, options.path, e).then(function () {
    // focus on the first field in the form we just created
    dom.find('[data-field]').focus();
  });
}

/**
 * only add focus decorator (e.g. click events) if it's NOT a component list
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function when(el, options) {
  var schema = _.get(options, 'data._schema');

  return !schema.hasOwnProperty(references.componentListProperty);
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
      focus(el, options, e);
    } else {
      e.stopPropagation();
    }
  });
  return el;
}

// focus and unfocus
module.exports.focus = focus;
module.exports.unfocus = unfocus;

// decorators
module.exports.when = when;
module.exports.handler = handler;
