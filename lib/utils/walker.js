import _ from 'lodash';
import { refAttr, editAttr, placeholderAttr } from './references';

/**
 * create a tree walker that only returns nodes in the current component
 * (if it hits a node with data-uri, it stops walking down that part of the tree)
 * @param  {Element} el component element
 * @returns {TreeWalker}
 */
function createComponentWalker(el) {
  return document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => node.hasAttribute(refAttr) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
}

// memoize the walker so it creates the same walker if you give it a component (element) with the same uri
const createWalker = _.memoize(createComponentWalker, (el) => el.getAttribute(refAttr));

/**
 * find all editable/placeholder nodes in the current component
 * 'editable' nodes are elements with `data-editable` attributes
 * 'placeholder' nodes are elements with `data-placeholder` attributes
 * note: this does NOT look into child components
 * @param  {Element} el component element
 * @param {string} type 'editable' or 'placeholder'
 * @returns {array} of elements
 */
export function getComponentNodes(el, type) {
  const walker = createWalker(el),
    attrs = {
      editable: editAttr,
      placeholder: placeholderAttr
    },
    attr = attrs[type];

  let nodes = [],
    node;

  if (!type) {
    throw new Error(`Must specify "editable" or "placeholder" when calling getComponentNodes, not ${type}!`);
  }

  // if the component element itself has the specified attribute, include it first
  if (el.hasAttribute(attr)) {
    nodes.push(el);
  }

  // add all child nodes with the attribute
  while (node = walker.nextNode()) {
    if (node && node.hasAttribute(attr)) {
      nodes.push(node);
    }
  }

  return nodes;
}
