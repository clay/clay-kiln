var _ = require('lodash'),
  dom = require('@nymag/dom'),
  ds = require('dollar-slice'),
  label = require('./label'),
  tpl = require('./tpl'),
  filterableListController = require('../controllers/filterable-list');

/**
 * add filtered items
 * note: items may be an array of strings, or objects with id and title
 * @param {array} items
 * @returns {Element}
 */
function addFilteredItems(items) {
  var wrapper = tpl.get('.filtered-items-template'),
    listEl = dom.find(wrapper, 'ul');

  _.each(items, function (item) {
    var itemEl = tpl.get('.filtered-item-template'),
      listItem = dom.find(itemEl, 'li');

    // add name and label to each list item
    if (_.isString(item)) {
      listItem.innerHTML = label(item);
      listItem.setAttribute('data-item-name', item);
    } else {
      listItem.innerHTML = item.title;
      listItem.setAttribute('data-item-name', item.id);
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
    itemsEl = addFilteredItems(items), // todo: remove, reorder, settings options
    el = dom.create('<div class="filterable-list-wrapper"></div>');

  if (!options.click) {
    throw new Error('Filterable Lists need a click function!');
  }

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
