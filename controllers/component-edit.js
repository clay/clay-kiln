/**
 * controller that gets instantiated for all editable components
 * @class
 */

'use strict';

function ComponentEdit() {
  var _ = require('lodash'),
    dom = require('../services/dom'),
    references = require('../services/references'),
    formCreator = require('../services/form-creator'),
    edit = require('../services/edit'),
    placeholder = require('../services/placeholder');

  /**
   * @param {Element} el
   * @returns {boolean}
   */
  function hasOpenInlineForms(el) {
    var possChildEl = dom.getFirstChildElement(el);
    return !!possChildEl && possChildEl.classList.contains('editor-inline');
  }

  /**
   * @param ref
   * @param el
   * @param path
   */
  function open(ref, el, path) {
    // first, check to make sure any inline forms aren't open in this element's children
    if (hasOpenInlineForms(el)) {
      return;
    }

    edit.getData(ref).then(function (data) {
      //If name, then we're going deep; Note anything with a name either modal by default or has a displayProperty.
      if (path) {
        data = _.get(data, path);
      }

      switch (data._schema[references.displayProperty]) {
        case 'inline':
          return formCreator.createInlineForm(ref, path, data, el);
        default: //case 'modal':
          return formCreator.createForm(ref, path, data);
      }
    });
  }

  /**
   * @constructs
   * @param el
   */
  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
    // Normally name is only on children of components. One exception is the tags component.
      componentHasName = el.getAttribute(references.componentAttribute) && el.getAttribute(references.nameAttribute),
      walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
        acceptNode: function (currentNode) {
          if (!currentNode.getAttribute(references.componentAttribute)) {
            return NodeFilter.FILTER_ACCEPT;
          } else {
            return NodeFilter.FILTER_REJECT;
          }
        }
      }),
      node,
      name;

    // Special case when name is in the component element.
    if (componentHasName) {
      name = componentHasName;
      el.addEventListener('click', open.bind(null, ref, name, el));
    }

    // add click events to children with [name], but NOT children inside child components
    while ((node = walker.nextNode())) {
      name = node.getAttribute(references.nameAttribute)
      if (name) {
        // add click event that generates a form
        node.addEventListener('click', open.bind(null, ref, node, name));
        // add mask
        placeholder(ref, node);
      }
    }
  }

  constructor.prototype = {
    events: {
      'a click': 'killLinks'
    },

    killLinks: function (e) {
      // prevent all links in this component from being clicked
      // allows us to attach click handlers to open things like tags, author, sources (lists of links)
      // users can still right-click + open in new tab on links they want to actually go to
      dom.preventDefault(e);
    }
  };
  return constructor;
}

module.exports = ComponentEdit;
