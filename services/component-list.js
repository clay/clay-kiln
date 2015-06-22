var _ = require('lodash'),
  references = require('./references'),
  forms = require('./forms');

/**
 * match when schema says it's a component list
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function when(el, options) {
  var schema = _.get(options, 'data._schema');

  return schema.hasOwnProperty(references.componentListProperty);
}

/**
 * add "add component" button
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
