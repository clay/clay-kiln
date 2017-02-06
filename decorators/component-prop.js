import _ from 'lodash';

var references = require('../services/references');

/**
 * match when schema says it's a component property
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function when(el, options) {
  var schema = _.get(options, 'data._schema');

  return !!schema && schema.hasOwnProperty(references.componentProperty);
}

/**
 * add "add component" button
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function handler(el, options) {
  var isPage = _.has(options, `data._schema.${references.componentProperty}.page`);

  el.classList.add('component-prop-wrapper');
  if (isPage) {
    el.classList.add('kiln-page-area');
  }

  return el;
}

module.exports.when = when;
module.exports.handler = handler;
