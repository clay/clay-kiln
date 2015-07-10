var domify = require('domify'),
  _ = require('lodash');

module.exports = {
  /**
   * Get url without _how_ to access it, creating a uri.
   *
   * Removes port and protocol.
   *
   * @returns {string}
   */
  uri: function () {
    var location = document.location;

    return location.hostname + location.pathname;
  },

  /**
   * This function can be minimized smaller than document.querySelector
   * @param {Element} [el]
   * @param {string} selector
   * @returns {Element}
   * @example find('ul') //finds globally
   * @example find(el, '.list') //finds within
   */
  find: function (el, selector) {
    if (!selector) {
      selector = el;
      el = document;
    }
    return el.querySelector(selector);
  },

  /**
   * This function can be minimized smaller than document.querySelector
   * @param {Element} [el]
   * @param {string} selector
   * @returns {NodeList}
   * @example findAll('ul') //finds globally
   * @example findAll(el, '.list') //finds within
   */
  findAll: function (el, selector) {
    if (!selector) {
      selector = el;
      el = document;
    }
    return el.querySelectorAll(selector);
  },

  /**
   * NOTE: nodeType of 1 means Element
   * @param {Element} parent
   * @returns {Element} cursor
   */
  getFirstChildElement: function (parent) {
    var cursor = parent.firstChild;

    while (cursor && cursor.nodeType !== 1) {
      cursor = cursor.nextSibling;
    }
    return cursor;
  },

  /**
   * get closest parent element that matches selector
   * @param  {Element} node
   * @param  {string} parentSelector
   * @return {Element|null}
   */
  closest: function (node, parentSelector) {
    var cursor = node;

    if (!parentSelector || typeof parentSelector !== 'string') {
      throw new Error('Please specify a selector to match against!');
    }

    while (cursor && !cursor.matches('body') && !cursor.matches(parentSelector)) {
      cursor = cursor.parentNode;
    }

    if (!cursor || cursor.matches('body')) {
      return null;
    } else {
      return cursor;
    }
  },

  prependChild: function (parent, child) {
    if (parent.firstChild) {
      parent.insertBefore(child, parent.firstChild);
    } else {
      parent.appendChild(child);
    }
  },

  insertBefore: function (node, newNode) {
    if (node.parentNode) {
      node.parentNode.insertBefore(newNode, node);
    }
  },

  insertAfter: function (node, newNode) {
    if (node.parentNode) {
      node.parentNode.insertBefore(newNode, node.nextSibling);
    }
  },

  /**
   * Fast way to clear all children
   * @see http://jsperf.com/innerhtml-vs-removechild/294
   * @param {Element} el
   */
  clearChildren: function (el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  },

  /**
   * Remove a single element from its parent
   * @param {Element} el
   */
  removeElement: function (el) {
    el.parentNode.removeChild(el);
  },

  preventDefault: function (e) {
    e.preventDefault ? e.preventDefault() : e.returnValue = false; // eslint-disable-line
  },

  replaceElement: function (el, replacementEl) {
    var parent = el.parentNode;

    if (parent) {
      parent.replaceChild(replacementEl, el);
    }
  },

  /**
   * wrap elements in another element
   * @param {NodeList|Element} els
   * @param {string} wrapper
   * @returns {Element} wrapperEl
   */
  wrapElements: function (els, wrapper) {
    var wrapperEl = document.createElement(wrapper);

    // make sure elements are in an array
    if (els instanceof HTMLElement) {
      els = [els];
    } else {
      els = Array.prototype.slice.call(els);
    }

    _.each(els, function (el) {
      // put it into the wrapper, remove it from its parent
      el.parentNode.removeChild(el);
      wrapperEl.appendChild(el);
    });

    // return the wrapped elements
    return wrapperEl;
  },

  /**
   * unwrap elements from another element
   * @param {Element} parent
   * @param {Element} wrapper
   */
  unwrapElements: function (parent, wrapper) {
    var el = wrapper.childNodes[0];

    // ok, so this looks weird, right?
    // turns out, appending nodes to another node will remove them
    // from the live NodeList, so we can keep iterating over the
    // first item in that list and grab all of them. Nice!
    while (el) {
      parent.appendChild(el);
      el = wrapper.childNodes[0];
    }

    parent.removeChild(wrapper);
  },

  /**
   * Run a function when an element is removed from the DOM.
   * Note: Observer is removed after the function is run once.
   * @param {Element} el    Element to observe.
   * @param {Function} fn   Function to execute when element is removed.
   */
  onRemove: function (el, fn) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (_.contains(mutation.removedNodes, el)) {
          fn();
          observer.disconnect();
        }
      });
    });

    observer.observe(el.parentNode, {childList: true});
  },

  create: domify // create elements from strings!
};
