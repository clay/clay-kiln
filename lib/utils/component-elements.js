import _ from 'lodash';
import { closest, findAll } from '@nymag/dom';
import { refAttr, layoutAttr, hiddenAttr } from './references';

/**
 * Get the closest component element from the DOM. Checks self and then parents.
 * @param {Element} el    Any element within a component.
 * @returns {Element|undefined}
 */
export function getComponentEl(el) {
  return el && closest(el, `[${refAttr}]`);
}

/**
 * Get the closest parent component of the component from the DOM.
 * @param {Element} el  A component element
 * @returns {Element}
 */
export function getParentComponent(el) {
  return el.parentNode && getComponentEl(el.parentNode);
}

export function getLayout() {
  const el = document.firstElementChild,
    uri = el.getAttribute(layoutAttr);

  return { el, uri };
}

/**
 * match against a component, optionally providing a component name
 * @param  {Element} el
 * @param  {string} [name]
 * @return {Element|undefined}
 */
function matchComponent(el, name) {
  if (name) {
    return el.nodeType === el.ELEMENT_NODE && _.includes(el.getAttribute(refAttr), `/components/${name}`);
  } else {
    return el.nodeType === el.ELEMENT_NODE && el.hasAttribute(refAttr);
  }
}

/**
 * get previous component element
 * @param  {Element} el inside current component
 * @param {string} [name] to match a specific component
 * @return {Element|undefined}
 */
export function getPrevComponent(el, name) {
  const componentEl = getComponentEl(el);

  let prev = componentEl.previousSibling;

  while (prev) {
    if (matchComponent(prev, name)) {
      return prev;
    } else {
      prev = prev.previousSibling;
    }
  }
}

/**
 * get next component element
 * @param  {Element} el inside current component
 * @param {string} [name] to match a specific component
 * @return {Element|undefined}
 */
export function getNextComponent(el, name) {
  const componentEl = getComponentEl(el);

  let next = componentEl.nextSibling;

  while (next) {
    if (matchComponent(next, name)) {
      return next;
    } else {
      next = next.nextSibling;
    }
  }
}

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
  return el.offsetParent !== null && !el.getAttribute(hiddenAttr);
}

export function getVisibleList() {
  return _.filter(findAll(`[${refAttr}]`), showVisible);
}

/**
 * get previous visible component
 * @param  {Element} el
 * @return {Element|undefined}
 */
export function getPrevVisible(el) {
  const list = getVisibleList();

  return list[list.indexOf(el) - 1];
}

/**
 * get next visible component
 * @param  {Element} el
 * @return {Element|undefined}
 */
export function getNextVisible(el) {
  const list = getVisibleList();

  return list[list.indexOf(el) + 1];
}
