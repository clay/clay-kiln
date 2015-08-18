/*
Page Ref is used to append hidden fields that allow component instances
to do logic with the URIs and Page IDs on the server-side

Page-Ref has no arguments!
 */

var dom = require('../services/dom');

module.exports = function (result) {
  var name = result.name;

  result.bindings.data.value = dom.uri(); // returns the current uri (for now)
  // todo: if behaviors supported promises, we could get the full page id
  result.el.appendChild(dom.create(`<input type="hidden" class="input-text" data-field="${name}" rv-value="${name}.data.value" />`));

  return result;
};
