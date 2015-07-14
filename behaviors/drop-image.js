// add dragdrop events to field
module.exports = function (result) {
  var el = result.el;

  // add event listeners that bind to rivets
  el.setAttribute('rv-on-dragover', 'onDrag');
  el.setAttribute('rv-on-drop', 'onDrop');

  result.bindings.onDrag = function (e) {
    e.preventDefault(); // allow drop events to happen
  };

  result.bindings.onDrop = function (e, bindings) {
    var data = e.dataTransfer.getData('text/uri-list');

    e.preventDefault(); // don't let the browser do anything funky with this
    bindings.data.value = data;
  };

  return result;
};
