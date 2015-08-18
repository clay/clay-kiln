/*
Drop Image has no arguments!
 */
var _ = require('lodash');

// add dragdrop events to field
module.exports = function (result) {
  var el = result.el,
    name = result.name;

  // add event listeners that bind to rivets
  el.setAttribute('rv-on-dragover', name + '.onDrag');
  el.setAttribute('rv-on-drop', name + '.onDrop');

  result.bindings.onDrag = function (e) {
    e.preventDefault(); // allow drop events to happen
  };

  result.bindings.onDrop = function (e, bindings) {
    var data = e.dataTransfer.getData('text/uri-list');

    e.preventDefault(); // don't let the browser do anything funky with this
    _.set(bindings, name + '.data.value', data);
  };

  return result;
};
