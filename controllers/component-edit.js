'use strict';
// controller that gets instantiated for all editable components
module.exports = function () {
  var dom = require('../services/dom'),
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

  function open(ref, name, el) {
    // first, check to make sure any inline forms aren't open in this element's children
    if (hasOpenInlineForms()) {
      return;
    }

    edit.getData(ref).then(function (data) {
      data[references.referenceProperty] = ref;

      switch (data._schema[references.displayProperty]) {
        case 'inline':
          return formCreator.createInlineForm(name, data, el);
        default: //case 'modal':
          return formCreator.createForm(name, data);
      }
    });
  }

  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
      // Normally name is only on children of components. One exception is the tags component.
      componentHasName = el.getAttribute(references.componentAttribute) && el.getAttribute(references.nameAttribute),
      walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, { acceptNode: function (node) {
        if (!node.getAttribute(references.componentAttribute)) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_REJECT;
        }
      }}),
      node,
      name;
    
    // Special case when name is in the component element.
    if (componentHasName) {
      name = componentHasName;
      el.addEventListener('click', open.bind(null, ref, name, el));
    }

    // add click events to children with [name], but NOT children inside child components
    while ((node = walker.nextNode())) {
      if (name = node.getAttribute(references.nameAttribute)) { // jshint ignore:line
        // add click event that generates a form
        node.addEventListener('click', open.bind(null, ref, name, node));
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
};