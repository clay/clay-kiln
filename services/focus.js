var _ = require('lodash'),
  references = require('./references'),
  forms = require('./forms'),
  select = require('./select'),
  currentFocus;

/**
 * set focus on an Element
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @param {MouseEvent} e
 */
function focus(el, options, e) {
  select.unselect();
  select.select(el);
  currentFocus = el;
  forms.open(options.ref, el, options.path, e);
}

/**
 * remove focus
 */
function unfocus() {
  select.unselect();
  currentFocus = null;
  forms.close();
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
  el.addEventListener('click', focus.bind(null, el, options));
  return el;
}

// focus and unfocus
module.exports.focus = focus;
module.exports.unfocus = unfocus;

// decorators
module.exports.when = when;
module.exports.handler = handler;
