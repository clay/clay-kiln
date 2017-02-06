import _ from 'lodash';

const dom = require('@nymag/dom');

/**
 * grab templates from the dom
 * @param {string} selector
 * @returns {Element}
 */
function getTemplate(selector) {
  var template = dom.find(selector);

  return document.importNode(template.content, true);
}

module.exports.get = getTemplate;

_.set(window, 'kiln.services.tpl', module.exports); // export for plugins
