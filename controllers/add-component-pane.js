var pane = require('../services/pane'),
  addComponent = require('../services/add-component'),
  dom = require('@nymag/dom'),
  keyCode = require('keycode');

/**
 * filter items in the list, based on the label or name
 * todo: in the future, allow more robust searching (description, etc)
 * @param {string} val
 * @param {NodeList} items
 */
function filter(val, items) {
  _.each(items, function (item) {
    var label = item.textContent,
      name = item.getAttribute('data-item-name');

    if (_.includes(label, val) || _.includes(name, val)) {
      item.classList.remove('filtered');
    } else {
      item.classList.add('filtered');
    }
  });
}

/**
 * get the available items
 * @param {NodeList} items
 * @returns {array}
 */
function getAvailable(items) {
  return _.filter(items, (item) => !item.classList.contains('filtered'));
}

/**
 * focus first available item in list
 * @param {NodeList} list
 */
function focusFirst(list) {
  list[0].focus();
}

/**
 * focus next available item
 * @param {Element} current
 * @param {NodeList} list
 */
function focusNext(current, list) {
  var index = list.indexOf(current);

  if (index < list.length) {
    list[index + 1].focus();
  }
}

/**
 * focus previous available item
 * @param {Element} current
 * @param {NodeList} list
 */
function focusPrev(current, list) {
  var index = list.indexOf(current);

  if (index > 0) {
    list[index - 1].focus();
  }
}

module.exports = function () {
  function constructor(el, options) {
    // parent options, passed in from the component list
    this.pane = options.pane;
    this.field = options.field;
    // useful elements
    this.input = dom.find(el, '.filtered-input');
    this.list = dom.find(el, '.filtered-items'),
    this.items = dom.findAll(this.list, '.filtered-item');
  }

  constructor.prototype = {
    events: {
      '.filtered-input keyup': 'onInputKeyup',
      '.filtered-item keyup': 'onItemKeyup'
    },

    onInputKeyup: function (e) {
      var input = this.input,
        key = keyCode(e),
        available = getAvailable(this.items);

      // if it's down, transfer focus
      // if it's enter, try to add component
      // if it's esc, exit the pane
      // if it's anything else, try to filter the list
      // note: tab will work natively

      if (key === 'down') {
        focusFirst(available); // focus on first available item in list
      } else if (key === 'enter' && available.length === 1) {
        addComponent(this.pane, this.field, available[0].getAttribute('data-item-name'))
          .then(() => pane.close()); // only close if we added successfully
      } else if (key === 'esc') {
        pane.close();
      } else {
        filter(input.value, this.items);
      }
    },

    onItemKeyup: function (e) {
      var key = keyCode(e),
        available = getAvailable(this.items),
        currentItem = e.target;

      // if it's down or up, transfer focus
      // note: tab and shift+tab will work natively with the visible items
      // if it's enter, try to add that component
      // if it's esc, exit the pane

      if (key === 'down') {
        focusNext(currentItem, available);
      } else if (key === 'up') {
        if (currentItem === available[0]) {
          // at the top of the available items, transfer focus to input
          this.input.focus();
        } else {
          // transfer focus up
          focusPrev(currentItem, available);
        }
      } else if (key === 'esc') {
        pane.close();
      } else if (key === 'enter') {
        addComponent(this.pane, this.field, currentItem.getAttribute('data-item-name'))
          .then(() => pane.close()); // only close if we added successfully
      }
    }
  };
  return constructor;
};
