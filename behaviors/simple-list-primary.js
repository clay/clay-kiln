var _ = require('lodash'),
  dom = require('../services/dom');

/**
 * Simple List Primary (used after simple-list)
 * @param {{name: string, el: Element, bindings: {}}} result
 * @param {{propertyName: string, badge: string}} args
 * @param {string} args.propertyName  name of the property that is considered "primary"
 * @param {string} [args.badge]       string to put in the badge. defaults to property name.
 * @returns {*}
 */
module.exports = function (result, args) {
  var prop = args.propertyName,
    badge = args.badge || prop,
    name = result.name,
    itemEls = dom.findAll(result.el, '.simple-list-item');

  // add doubleclick event to all list items
  _.forEach(itemEls, function (itemEl) {
    itemEl.setAttribute('rv-on-dblclick', `${name}.togglePrimary`);
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
      data = bindings[name].data,
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
