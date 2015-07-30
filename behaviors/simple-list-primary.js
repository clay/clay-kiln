/*
Simple List Primary arguments

propertyName {string} name of the property that is considered "primary"
badge {string} string to put in the badge. defaults to property name
 */

var _ = require('lodash'),
  dom = require('../services/dom');

module.exports = function (result, args) {
  var prop = args.propertyName,
    badge = args.badge || prop,
    itemEls = dom.findAll(result.el, '.simple-list-item');

  // add doubleclick event to all list items
  _.forEach(itemEls, function (itemEl) {
    itemEl.setAttribute('rv-on-dblclick', 'togglePrimary');
    itemEl.setAttribute('rv-class-primary', 'item.' + prop);

    // add primary badge
    itemEl.appendChild(dom.create('<div class="badge">' + badge + '</div>'));
    return itemEl;
  });

  /**
   * unset all items
   * @param {array} items
   * @returns {array}
   */
  function unsetAll(items) {
    return items.map(function (item) {
      item[prop] = false;
      return item;
    });
  }

  /**
   * toggle primary
   * @param {object} bindings
   */
  function togglePrimary(bindings) {
    var item = bindings.item,
      data = bindings.data,
      isPrimary = item[prop]; // get this before unsetting everything

    unsetAll(data);
    if (!isPrimary) {
      item[prop] = true;
    }
  }

  // double clicking unsets all items and sets the current item as primary,
  // using whatever property name you passed through as an argument
  /**
   * toggle primary
   * @param {MouseEvent} e
   * @param {object} bindings
   */
  result.bindings.togglePrimary = function (e, bindings) {
    togglePrimary(bindings);
  };

  return result;
};
