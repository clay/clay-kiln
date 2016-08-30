const dom = require('@nymag/dom'),
  keyCode = require('keycode'),
  _ = require('lodash'),
  pane = require('../services/pane'),
  dragula = require('dragula');

/**
 * filter items in the list, based on the label or name
 * @param {string} val
 * @param {NodeList} items
 */
function filter(val, items) {
  _.each(items, function (item) {
    var label = item.textContent.toLowerCase(),
      name = item.getAttribute('data-item-id').toLowerCase();

    val = val.toLowerCase();

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
  if (list[0]) {
    list[0].focus();
  }
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

/**
 * get index of a child element in a container
 * @param {Element} el
 * @param {Element} container
 * @returns {number}
 */
function getIndex(el, container) {
  return _.findIndex(container.children, (child) => child === el);
}

/**
 * Add dragula.
 * @param {Element} el (list item)
 * @param {Function} reorder
 */
function addDragula(el, reorder) {
  var dropAreaClass = 'dragula-drop-area',
    dragItemClass = 'dragula-list-item',
    drag = dragula([el], { deadzone: 10 }),
    oldIndex;

  drag.on('drag', function (selectedItem, container) {
    selectedItem.classList.add(dragItemClass);
    container.classList.add(dropAreaClass);
    oldIndex = getIndex(selectedItem, container);
  });
  drag.on('cancel', function (selectedItem, container) {
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
  });
  drag.on('drop', function (selectedItem, container) {
    selectedItem.classList.remove(dragItemClass);
    container.classList.remove(dropAreaClass);
    reorder(selectedItem.getAttribute('data-item-id'), getIndex(selectedItem, container), oldIndex, selectedItem);
  });
}

module.exports = function () {
  function constructor(el, options) {
    // useful elements
    this.input = dom.find(el, '.filtered-input');
    this.list = dom.find(el, '.filtered-items'),
    this.items = dom.findAll(this.list, '.filtered-item');

    // give the pane a moment to animate in, then focus the input
    setTimeout(() => this.input.focus(), 100);

    // set the height so when we filter it won't jump around
    this.list.style.height = getComputedStyle(this.list).height;

    // add drag handler for reordering items
    if (options.reorder) {
      addDragula(this.list, options.reorder);
    }

    // make the options available to event handlers
    this.options = options;
  }

  constructor.prototype = {
    events: {
      '.filtered-input keydown': 'onInputKeydown',
      '.filtered-input keyup': 'onInputKeyup',
      '.filtered-item keydown': 'onItemKeydown',
      '.filtered-item keyup': 'onItemKeyup',
      '.filtered-item-title click': 'onItemClick',
      // optional events
      '.filtered-item-remove click': 'onRemoveClick',
      '.filtered-item-settings click': 'onSettingsClick',
      '.filtered-add click': 'onAddClick'
    },

    onInputKeydown: function (e) {
      var key = keyCode(e),
        available = getAvailable(this.items);

      // simulate active states when pressing enter
      if (key === 'enter' && available.length === 1) {
        available[0].classList.add('active');
      }
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
        available[0].classList.remove('active');
        e.preventDefault();
        this.options.click(available[0].getAttribute('data-item-id'), available[0]);
      } else if (key === 'enter') {
        input.classList.add('kiln-shake');
        setTimeout(() => input.classList.remove('kiln-shake'), 301); // length of the animation + 1
      } else if (key === 'esc') {
        pane.close();
      } else {
        filter(input.value, this.items);
      }
    },

    onItemKeydown: function (e) {
      // simulate active states when pressing enter
      if (keyCode(e) === 'enter') {
        e.currentTarget.classList.add('active');
      }
    },

    onItemKeyup: function (e) {
      var key = keyCode(e),
        available = getAvailable(this.items),
        currentItem = e.currentTarget;

      // remove any active state if it exists
      currentItem.classList.remove('active');

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
        e.preventDefault();
        this.options.click(currentItem.getAttribute('data-item-id'), currentItem);
      }
    },

    onItemClick: function (e) {
      var currentItem = e.currentTarget.parentElement,
        id = currentItem.getAttribute('data-item-id');

      e.preventDefault();
      e.stopPropagation();
      this.options.click(id, currentItem);
    },

    onRemoveClick: function (e) {
      var currentItem = e.currentTarget.parentElement,
        id = currentItem.getAttribute('data-item-id'),
        confirm = window.confirm('Remove from this list?'); // eslint-disable-line

      if (confirm) {
        this.options.remove(id, currentItem);
      }
    },

    onSettingsClick: function (e) {
      var currentItem = e.currentTarget.parentElement,
        id = currentItem.getAttribute('data-item-id');

      this.options.settings(id, currentItem);
    },

    onAddClick: function (e) {
      var addEl = e.currentTarget;

      this.options.add(addEl);
    }
  };
  return constructor;
};
