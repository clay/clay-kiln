/**
 * controller that gets instantiated for all editable components
 * @class
 */

function ComponentEdit() {
  var edit = require('../services/edit'),
    events = require('../services/events'),
    references = require('../services/references'),
    decorate = require('../services/components/decorators'),
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
   * decorate nodes with click events, placeholders, and other decorators
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
  }

  /**
   * @constructs
   * @param {Element} el
   * @returns {Promise}
   */
  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
      componentHasPath = ref && !!getDecoratorPath(el),
      promises = [],
      scope = this,
      walker, node, path;

    return edit.getComponentRef(ref).then(function (componentRef) {
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
      while (node = walker.nextNode()) {
        decorateNodes(node, walker, componentRef, promises);
      }

    // special case when editable path is in the component's root element.
      if (componentHasPath) {
        path = getDecoratorPath(el);
        promises.push(decorate(el, componentRef, path));
      }

      events.add(el, {
        'a click': 'killLinks'
      }, scope);

      return Promise.all(promises);
    });
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
