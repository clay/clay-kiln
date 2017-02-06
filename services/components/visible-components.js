import _ from 'lodash';

const dom = require('@nymag/dom'),
  references = require('../references');

/**
 * determine if an element is visible on the page
 * @param {Element} el
 * @returns {boolean}
 */
function showVisible(el) {
  // checking offsetParent works for all non-fixed elements,
  // and is much faster than checking getComputedStyle(el).display and visibility
  // note: [data-kiln-hidden] is a special attribute you can add to your
  // component's root element to hide it from the visible component list
  // and selector-based component navigation
  return el.offsetParent !== null && !el.getAttribute('data-kiln-hidden');
}

/**
 * generate a list of components that includes all visible components on the page
 * @returns {array} array of elements
 */
function list() {
  return _.filter(dom.findAll(`[${references.referenceAttribute}]`), showVisible);
}

/**
 * get previous visible component on the page
 * @param {Element} el of current component
 * @returns {Element|undefined}
 */
function getPrev(el) {
  const currentList = list(); // get a fresh list

  return currentList[currentList.indexOf(el) - 1];
}

/**
 * get next visible component on the page
 * @param {Element} el of current component
 * @returns {Element|undefined}
 */
function getNext(el) {
  const currentList = list(); // get a fresh list

  return currentList[currentList.indexOf(el) + 1];
}

module.exports.list = list; // note: don't memoize, as people add/remove components frequently
module.exports.getPrev = getPrev;
module.exports.getNext = getNext;
