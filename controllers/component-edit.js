/**
 * controller that gets instantiated for all editable components
 * @class
 */

function ComponentEdit() {
  var forms = require('../services/forms'),
    dom = require('../services/dom'),
    references = require('../services/references'),
    decorate = require('../services/decorators'),
    editableAttr = references.editableAttribute;

  /**
   * recursively decorate nodes with click events, placeholders, and other decorators
   * @param {Element} node
   * @param {TreeWalker} walker
   * @param {string} ref
   */
  function decorateNodes(node, walker, ref) {
    var path = node && node.getAttribute(editableAttr); // only assign a path if node exists

    if (path) {
      // this element is editable, decorate it!
      decorate(node, {
        ref: ref,
        path: path
      });
    }

    if (node) {
      // keep walking through the nodes
      decorateNodes(walker.nextNode(), walker, ref);
    }
  }

  /**
   * @constructs
   * @param {Element} el
   */
  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
      isComponentEditable = el.hasAttribute(editableAttr) || !!dom.find(el, '[' + editableAttr + ']'),
      componentHasName = ref && el.getAttribute(editableAttr),
      walker, name;

    if (isComponentEditable) {
      walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
        acceptNode: function (currentNode) {
          if (!currentNode.hasAttribute(references.referenceAttribute)) {
            return NodeFilter.FILTER_ACCEPT;
          } else {
            return NodeFilter.FILTER_REJECT;
          }
        }
      });

      // add click events to children with [name], but NOT children inside child components
      decorateNodes(walker.nextNode(), walker, ref);

      // Special case when name is in the component element.
      if (componentHasName) {
        name = el.getAttribute(editableAttr);
        el.addEventListener('click', forms.open.bind(null, ref, el, name));
        // add placeholder
        placeholder(ref, el);
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
