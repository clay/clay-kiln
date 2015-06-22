var _ = require('lodash'),
  references = require('./references'),
  forms = require('./forms');

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
  el.addEventListener('click', forms.open.bind(null, options.ref, el, options.path));
  return el;
}

module.exports.when = when;
module.exports.handler = handler;
