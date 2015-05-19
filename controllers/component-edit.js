'use strict';
// controller that gets instantiated for all editable components
module.exports = function () {
  var dom = require('../services/dom'),
    references = require('../services/references'),
    formcreator = require('../services/formcreator'),
    edit = require('../services/edit'),
    placeholder = require('../services/placeholder');

  function open(ref, name, el) {
    var possChildEl = dom.getFirstChildElement(el);
    // first, check to make sure any inline forms aren't open in this element's children
    if (possChildEl && possChildEl.classList.contains('editor-inline')) {
      return;
    } else {
      edit.getSchemaAndData(ref, name).then(function (res) {
        var schema = res.schema,
          data = res.data,
          display = schema[references.displayProperty] || 'modal', // defaults to modal
          formOptions = {
            schema: schema,
            data: data,
            ref: ref
          };

        if (display === 'modal') {
          formcreator.createModalForm(name, formOptions);
        } else if (display === 'inline') {
          formcreator.createInlineForm(name, formOptions, el);
        }
      });
    }
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