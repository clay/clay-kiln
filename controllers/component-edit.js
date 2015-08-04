/**
 * controller that gets instantiated for all editable components
 * @class
 */

function ComponentEdit() {
  var dom = require('../services/dom'),
    references = require('../services/references'),
    decorate = require('../services/decorators'),
    editableAttr = references.editableAttribute,
    placeholderAttr = references.placeholderAttribute;

  /**
   * recursively decorate nodes with click events, placeholders, and other decorators
   * @param {Element} node
   * @param {TreeWalker} walker
   * @param {string} ref
   * @param {array} promises    hold onto promises so that they can be returned.
   */
  function decorateNodes(node, walker, ref, promises) {
    var path = node && (node.getAttribute(editableAttr) || node.getAttribute(placeholderAttr)); // only assign a path if node exists

    if (path) {
      // this element is editable, decorate it!
      promises.push(decorate(node, ref, path));
    }

    if (node) {
      // keep walking through the nodes
      decorateNodes(walker.nextNode(), walker, ref, promises);
    }
  }

  /**
   * @constructs
   * @param {Element} el
   * @returns {Promise}
   */
  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
      isComponentEditable = el.hasAttribute(editableAttr) || !!dom.find(el, '[' + editableAttr + ']') || !!dom.find(el, '[' + placeholderAttr + ']'),
      componentHasPath = ref && (el.getAttribute(editableAttr) || el.getAttribute(placeholderAttr)),
      walker, path, promises = [];

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
      decorateNodes(walker.nextNode(), walker, ref, promises);

      // special case when editable path is in the component's root element.
      if (componentHasPath) {
        path = el.getAttribute(editableAttr) || el.getAttribute(placeholderAttr);
        promises.push(decorate(el, ref, path));
      }
    }
    return Promise.all(promises);
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
