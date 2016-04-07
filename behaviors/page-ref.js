var dom = require('@nymag/dom');

/**
 * Appends hidden field to allow component instances to affect URI's and Page ID's.
 * No args because pageID is from the page's URL.
 * @param {{name: string, el: Element, bindings: {}}} result
 * @returns {{}}
 */
module.exports = function (result) {
  var name = result.name;

  result.bindings.data.value = dom.uri(); // returns the current uri (for now)
  // todo: if behaviors supported promises, we could get the full page id
  result.el.appendChild(dom.create(`<input type="hidden" class="input-text" rv-field="${name}" rv-value="${name}.data.value" />`));

  return result;
};
