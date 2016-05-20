var dom = require('@nymag/dom');

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
