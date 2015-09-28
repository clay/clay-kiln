/**
 * controller that gets instantiated for all editable components
 * @class
 */

function ComponentEdit() {
  var dom = require('../services/dom'),
    events = require('../services/events'),
    references = require('../services/references'),
    decorate = require('../services/decorators'),
    editableAttr = references.editableAttribute,
    placeholderAttr = references.placeholderAttribute;

  /**
   * get a path to decorate
   * @param {Element} el
   * @returns {string|undefined}
   */
  function getDecoratorPath(el) {
    return el && (el.getAttribute(editableAttr) || el.getAttribute(placeholderAttr));
  }

  /**
   * recursively decorate nodes with click events, placeholders, and other decorators
   * @param {Element} node
   * @param {TreeWalker} walker
   * @param {string} ref
   * @param {array} promises    hold onto promises so that they can be returned.
   */
  function decorateNodes(node, walker, ref, promises) {
    var path = getDecoratorPath(node); // only assign a path if node exists

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
   * find out if component is editable or contains editable children
   * @param  {Element}  el component element
   * @return {Boolean}
   */
  function isComponentEditable(el) {
    return el.hasAttribute(editableAttr) ||
      el.hasAttribute(placeholderAttr) ||
      !!dom.find(el, '[' + editableAttr + ']') ||
      !!dom.find(el, '[' + placeholderAttr + ']');
  }

  /**
   * @constructs
   * @param {Element} el
   * @returns {Promise}
   */
  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
      componentHasPath = ref && !!getDecoratorPath(el),
      walker, path, promises = [];

    if (isComponentEditable(el)) {
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
        path = getDecoratorPath(el);
        promises.push(decorate(el, ref, path));
      }
    }

    events.add(el, {
      'a click': 'killLinks'
    }, this);

    return Promise.all(promises);
  }

  constructor.prototype = {

    killLinks: function (e) {
      // prevent all links in this component from being clicked
      // allows us to attach click handlers to open things like tags, author, sources (lists of links)
      // users can still right-click + open in new tab on links they want to actually go to
      if (e) {
        e.preventDefault();
      }
    }
  };
  return constructor;
}

module.exports = ComponentEdit;
