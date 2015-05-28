'use strict';
var domify = require('domify');

module.exports = {
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
   * @throws {Error} If nothing matches before it hits the body
   * @return {Element}
   */
  closest: function (node, parentSelector) {
    if (!parentSelector || typeof parentSelector !== 'string') {
      throw new Error('Please specify a selector to match against!');
    }

    var cursor = node;
    while (!cursor.matches('body') && !cursor.matches(parentSelector)) {
      cursor = cursor.parentNode;
    }

    // throw an error if we hit the body before matching anything
    if (cursor.matches('body')) {
      throw new Error(parentSelector + ' not found!');
    }

    return cursor;
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
    e.preventDefault ? e.preventDefault() : e.returnValue = false;
  },

  replaceElement: function (el, replacementEl) {
    var parent = el.parentNode;

    if (parent) {
      parent.replaceChild(replacementEl, el);
    }
  },

  create: domify // create elements from strings!
};