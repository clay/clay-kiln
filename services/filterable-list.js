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
 * append the add button and title
 * @param {Element} el
 * @param {object} options
 * @param {Function} options.add
 * @param {string} [options.addTitle]
 */
function appendAddButton(el, options) {
  var addEl = tpl.get('.filtered-add-template');

  if (options.addTitle) {
    dom.find(addEl, '.filtered-add-button').setAttribute('title', options.addTitle);
    dom.find(addEl, '.filtered-add-title').innerHTML = options.addTitle;
  }

  el.appendChild(addEl);
}

/**
 * replace the default input placeholder
 * @param {Element} el
 * @param {string} text
 */
function replaceInputPlaceholder(el, text) {
  var input = dom.find(el, '.filtered-input');

  input.setAttribute('placeholder', text);
}

/**
 * create a filterable list
 * note: add an `active` class to specific list items to apply the "active" styles to that item
 * @param {array} items
 * @param {object} options
 * @param {function} options.click called with id when users click an item
 * @param {function} [options.add] if passed in, shows add button below list. called with add button element when clicked
 * @param {function} [options.remove] if passed in, shows delete button on items. called with id when clicked
 * @param {function} [options.settings] if passed in, shows settings button on items. called with id when clicked
 * @param {function} [options.reorder] if passed in, shows grab icon on items and enables drag-drop. called with id, new index, and old index when items are reordered
 * @param {string} [options.addTitle] if passed in, replaces default add button title
 * @param {string} [options.inputPlaceholder] if passed in, replaces default input placeholder
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

  if (options.add) {
    appendAddButton(el, options);
  }

  if (options.inputPlaceholder) {
    replaceInputPlaceholder(el, options.inputPlaceholder);
  }

  // init controller for filterable list
  ds.controller('filterable-list', filterableListController);
  ds.get('filterable-list', el, options);
  return el;
}

module.exports.create = create;
_.set(window, 'kiln.services[filterable-list]', module.exports); // export for plugins
