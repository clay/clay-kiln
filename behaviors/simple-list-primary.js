var _ = require('lodash'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var prop = args.propertyName,
    itemEls = dom.findAll(result.el, '.simple-list-item');

  // add doubleclick event to all list items
  _.forEach(itemEls, function (itemEl) {
    itemEl.setAttribute('rv-on-dblclick', 'setPrimary');
    itemEl.setAttribute('rv-class-primary', 'item.' + prop);
    return itemEl;
  });

  function unsetAll(items) {
    return items.map(function (item) {
      item[prop] = false;
      return item;
    });
  }

  function setPrimary(bindings) {
    var item = bindings.item,
      data = bindings.data;

    unsetAll(data);
    item[prop] = true;
  }

  // double clicking unsets all items and sets the current item as primary,
  // using whatever property name you passed through as an argument
  result.bindings.setPrimary = function (e, bindings) {
    setPrimary(bindings);
  };

  return result;
};
