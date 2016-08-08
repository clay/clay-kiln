const _ = require('lodash'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  label = require('./label'),
  tpl = require('./tpl'),
  filterableListController = require('../controllers/filterable-list'),
  kilnHideClass = 'kiln-hide';

/**
 * add filtered items
 * note: items may be an array of strings, or objects with id and title
 * @param {array} items
 * @param {object} options
 * @returns {Element}
 */
function addFilteredItems(items, options) {
  var wrapper = tpl.get('.filtered-items-template'),
    listEl = dom.find(wrapper, 'ul');

  _.each(items, function (item) {
    var itemEl = tpl.get('.filtered-item-template'),
      listItem = dom.find(itemEl, 'li'),
      listItemTitle = dom.find(itemEl, '.filtered-item-title');

    // add title and id to each list item
    // note: title is set inside a specific span, whereas
    // id is set on the list item itself
    if (_.isString(item)) {
      listItemTitle.innerHTML = label(item);
      listItem.setAttribute('data-item-id', item);
    } else {
      listItemTitle.innerHTML = item.title; // allows html
      listItem.setAttribute('data-item-id', item.id);
    }

    // 'remove' button
    if (options.remove) {
      dom.find(listItem, '.filtered-item-remove').classList.remove(kilnHideClass);
    }

    // 'settings' button
    if (options.settings) {
      dom.find(listItem, '.filtered-item-settings').classList.remove(kilnHideClass);
    }

    // 'reorder' button
    if (options.reorder) {
      dom.find(listItem, '.filtered-item-reorder').classList.remove(kilnHideClass);
    }

    // add it to the list
    listEl.appendChild(itemEl);
  });

  return wrapper;
}

/**
 * create a filterable list
 * @param {array} items
 * @param {object} options
 * @returns {Element}
 */
function create(items, options) {
  var inputEl = tpl.get('.filtered-input-template'),
    el = dom.create('<div class="filterable-list-wrapper"></div>'),
    itemsEl;

  if (!_.isArray(items) || !_.isObject(options)) {
    throw new Error('Filterable lists need items and an options object!');
  } else if (!options.click) {
    throw new Error('Filterable lists need a click function!');
  }

  itemsEl = addFilteredItems(items, options);

  el.appendChild(inputEl);
  el.appendChild(itemsEl);
  // todo: add button if it's in the options

  // init controller for filterable list
  ds.controller('filterable-list', filterableListController);
  ds.get('filterable-list', el, options);
  return el;
}

module.exports.create = create;
_.set(window, 'kiln.services[filterable-list]', module.exports); // export for plugins
