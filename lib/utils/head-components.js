import _ from 'lodash';
import { removeElement } from '@nymag/dom';
import label from './label';
import { getComponentName } from './references';

/**
 * determine if a node begins a component list. they look like:
 * <!-- data-editable="path" -->
 * note: exported for testing
 * @param {Node} node
 * @returns {boolean}
 */
export function isComponentListStart(node) {
  return !!node && node.nodeType === node.COMMENT_NODE && !!node.data.match(/data-editable="(.*?)"/);
}

/**
 * get path from a component list start comment
 * note: assumes we've already checked this node with isComponentListStart()
 * note: exported for testing
 * @param {Node} node
 * @returns {string}
 */
export function getComponentListPath(node) {
  return node.data.match(/data-editable="(.*?)"/)[1];
}

/**
 * get start node for a component list
 * note: exported for testing
 * @param  {string} path
 * @param {Document} [doc]
 * @return {Node}
 */
export function getComponentListStart(path, doc) {
  const root = doc || document,
    head = root.head || doc, // re-rendered layouts won't have a <head> in their fragment. it's weird
    walker = document.createTreeWalker(head, NodeFilter.SHOW_COMMENT);

  let node;

  while (node = walker.nextNode()) {
    if (isComponentListStart(node) && getComponentListPath(node) === path) {
      return node;
    }
  }
}

/**
 * determine what list a component is inside
 * @param  {Node} node
 * @return {string|undefined}      returns undefined if not inside a component list
 */
export function getComponentListStartFromComponent(node) {
  if (node.previousSibling && isComponentListStart(node.previousSibling)) {
    return getComponentListPath(node.previousSibling);
  } else if (node.previousSibling) {
    return getComponentListStartFromComponent(node.previousSibling);
  }
}

/**
 * determine if a node ends a component list. they look like:
 * <!-- data-editable-end -->
 * note: exported for testing
 * @param {Node} node
 * @returns {boolean}
 */
export function isComponentListEnd(node) {
  return !!node && node.nodeType === node.COMMENT_NODE && !!node.data.match(/data-editable-end/);
}

/**
 * recursively try to find the end of a component list
 * note: exported for testing
 * @param {Node} node
 * @returns {Node|undefined}
 */
export function getComponentListEnd(node) {
  if (isComponentListEnd(node)) {
    return node;
  } else if (node.nextSibling) {
    return getComponentListEnd(node.nextSibling);
  }
}

/**
 * get component ref for a head component
 * note: exported for testing
 * @param {Node} node
 * @returns {string}
 */
export function getComponentRef(node) {
  return !!node && node.nodeType === node.COMMENT_NODE && !!node.data.match(/data-uri="(.*?)"/) && node.data.match(/data-uri="(.*?)"/)[1];
}

/**
 * find the first component node from a uri
 * note: exported for testing
 * @param {string} uri
 * @returns {Node}
 */
export function getComponentNode(uri) {
  const walker = document.createTreeWalker(document.head, NodeFilter.SHOW_COMMENT);

  let node;

  while (node = walker.nextNode()) {
    if (getComponentRef(node) === uri) {
      return node;
    }
  }
}

/**
 * get the last node in a component, given any node in the component
 * note: exported for testing
 * @param {Node} node
 * @returns {Node}
 */
export function getComponentEnd(node) {
  if (node.nextSibling && (isComponentListEnd(node.nextSibling) || getComponentRef(node.nextSibling))) {
    return node;
  } else if (node.nextSibling) {
    return getComponentEnd(node.nextSibling);
  }
}

/**
 * get the head component, as a document fragment
 * @param  {string} uri
 * @return {DocumentFragment}
 */
export function getComponentFragment(uri) {
  const startNode = getComponentNode(uri),
    endNode = getComponentEnd(startNode);

  let currentNode = startNode,
    clones = document.createDocumentFragment();

  while (currentNode !== endNode) {
    let clone = currentNode.cloneNode(true),
      nextNode = currentNode.nextSibling;

    clones.appendChild(clone);
    currentNode = nextNode;
  }

  return clones;
}

/**
 * get the head component, as a document fragment
 * @param  {string} path
 * @param {Document} [doc] if getting list in a different (new) document
 * @return {DocumentFragment}
 */
export function getComponentListFragment(path, doc) {
  const startNode = getComponentListStart(path, doc),
    endNode = getComponentListEnd(startNode);

  let currentNode = startNode,
    clones = document.createDocumentFragment();

  while (currentNode !== endNode) {
    let clone = currentNode.cloneNode(true),
      nextNode = currentNode.nextSibling;

    clones.appendChild(clone);
    currentNode = nextNode;
  }

  return clones;
}

/**
 * given the first (data-uri) node of a component, remove it from the dom
 * note: exported for testing
 * @param {Node} node
 * @returns {Element} fragment containing clone of the removed nodes
 */
export function removeComponentFromDOM(node) {
  const endNode = getComponentEnd(node);

  let currentNode = node,
    clones = document.createDocumentFragment();

  while (currentNode !== endNode) {
    let clone = currentNode.cloneNode(true),
      nextNode = currentNode.nextSibling;

    removeElement(currentNode);
    clones.appendChild(clone);
    currentNode = nextNode;
  }

  return clones;
}

/**
 * given the first (data-editable) node of a component list, remove it from the dom
 * note: exported for testing
 * @param {Node} node
 * @returns {Element} fragment containing clone of the removed nodes
 */
export function removeListFromDOM(node) {
  const endNode = getComponentListEnd(node);

  let currentNode = node,
    clones = document.createDocumentFragment();

  while (currentNode !== endNode) {
    let clone = currentNode.cloneNode(true),
      nextNode = currentNode.nextSibling;

    removeElement(currentNode);
    clones.appendChild(clone);
    currentNode = nextNode;
  }

  return clones;
}

/**
 * iterate through a fragment, adding nodes after a specified node
 * note: exported for testing
 * @param {Node} node
 * @param {Element} fragment
 */
export function insertAfter(node, fragment) {
  let currentNode = node,
    parent = node.parentNode;

  _.each(fragment.childNodes, function (child) {
    parent.insertBefore(child.cloneNode(true), currentNode.nextSibling);
    currentNode = currentNode.nextSibling;
  });
}

/**
 * re-render a head component, replacing it in the dom
 * note: head components don't get decorated
 * note: the fragment passed in has already been diffed against the current component
 * @param  {string} uri
 * @param {DocumentFragment} fragment
 */
export function replaceHeadComponent(uri, fragment) {
  const firstNode = getComponentNode(uri),
    prevNode = firstNode.previousSibling; // will be either the last node of the previous component, or the node that begins the component list

  removeComponentFromDOM(firstNode);
  insertAfter(prevNode, fragment);
}

/**
 * re-render a head component list, replacing it in the dom
 * note: head components don't get decorated
 * note: the fragment passed in has already been diffed against the current list
 * @param  {string} path
 * @param  {DocumentFragment} fragment
 */
export function replaceHeadList(path, fragment) {
  const firstNode = getComponentListStart(path), // start of the list
    prevNode = firstNode.previousSibling; // will either be the last node of the previous list, or the node before the first list

  removeListFromDOM(firstNode);
  insertAfter(prevNode, fragment);
}

/**
 * given a list start node, create an array of the components in this list
 * note: exported for testing
 * @param {Node} node
 * @returns {array} list of component refs
 */
export function getList(node) {
  let currentNode = node,
    list = [];

  while (currentNode && !isComponentListEnd(currentNode)) {
    let componentRef = getComponentRef(currentNode);

    if (componentRef) {
      list.push({
        id: componentRef,
        title: label(getComponentName(componentRef))
      });
    }
    currentNode = currentNode.nextSibling;
  }

  return list;
}

/**
 * determine if a node begins a component list, and add it if so
 * @param {Node} node
 * @param {TreeWalker} walker
 * @param {array} lists
 */
function addList(node, walker, lists) {
  if (isComponentListStart(node)) {
    lists.push({
      path: getComponentListPath(node),
      components: getList(node),
      start: node,
      end: getComponentListEnd(node)
    });
  }
}

/**
 * get component lists in the head of the document
 * @return {array}
 */
export function getListsInHead() {
  const walker = document.createTreeWalker(document.head, NodeFilter.SHOW_COMMENT);

  let lists = [],
    node;

  while (node = walker.nextNode()) {
    addList(node, walker, lists);
  }

  return lists;
}
