/**
 * controller that gets instantiated for all editable components
 * @class
 */

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
    return !!dom.find(el, '.editor-inline');
  }

  /**
   * @param {event} e
   * @param {string} ref
   * @param {Element} el
   * @param {string} path
   */
  function open(e, ref, el, path) {
    // first, check to make sure any inline forms aren't open in this element's children
    if (!hasOpenInlineForms(el)) {
      e.stopPropagation();
      edit.getData(ref).then(function (data) {
        // If name, then we're going deep; Note anything with a name either modal by default or has a displayProperty.
        if (path) {
          data = _.get(data, path);
        }

        switch (data._schema[references.displayProperty]) {
          case 'inline':
            return formCreator.createInlineForm(ref, path, data, el);
          default: // case 'modal':
            return formCreator.createForm(ref, path, data);
        }
      });
    }
  }

  /**
   * recursively decorate nodes with click events and placeholders
   * @param {Element} node
   * @param {TreeWalker} walker
   * @param {string} ref
   */
  function decorateNodes(node, walker, ref) {
    var name = node && node.getAttribute('name'); // only assign a name if node exists

    if (name) {
      // add click event that generates a form
      node.addEventListener('click', function (e) {
        open(e, ref, node, name);
      });

      // add placeholder
      placeholder(ref, node);
    }

    if (node) {
      decorateNodes(walker.nextNode(), walker, ref);
    }
  }

  /**
   * @constructs
   * @param {Element} el
   */
  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
      isComponentEditable = el.hasAttribute('name') || !!dom.find(el, '[name]'),
      componentHasName = ref && el.getAttribute('name'),
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
        name = el.getAttribute('name');
        el.addEventListener('click', function (e) {
          open(e, ref, el, name);
        });
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
