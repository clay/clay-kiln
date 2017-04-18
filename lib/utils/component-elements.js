import _ from 'lodash';
import { closest, findAll, find } from '@nymag/dom';
import { refAttr, editAttr, layoutAttr, hiddenAttr } from './references';

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
 * if the component has no parentNode (e.g. it's outside the DOM, being re-rendered),
 * search for the component in the dom before finding the parent
 * @param {Element} el  A component element
 * @returns {Element|null}
 */
export function getParentComponent(el) {
  if (el.parentNode) {
    return getComponentEl(el.parentNode);
  } else {
    const uri = el.getAttribute(refAttr),
      domEl = find(`[${refAttr}="${uri}"]`);

    return domEl && domEl.parentNode && getComponentEl(domEl.parentNode);
  }
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

/**
 * get list of visible components on the page
 * @param  {Element} [doc] for testing
 * @return {array}
 */
export function getVisibleList(doc) {
  doc = doc || /* istanbul ignore next */ document.body;

  return _.filter(findAll(doc, `[${refAttr}]`), showVisible);
}

/**
 * get previous visible component
 * @param  {Element} el
 * @param {Element} [doc] for testing
 * @return {Element|undefined}
 */
export function getPrevVisible(el, doc) {
  const list = getVisibleList(doc);

  return list[list.indexOf(el) - 1];
}

/**
 * get next visible component
 * @param  {Element} el
 * @param {Element} [doc] for testing
 * @return {Element|undefined}
 */
export function getNextVisible(el, doc) {
  const list = getVisibleList(doc);

  return list[list.indexOf(el) + 1];
}

/**
 * return selectors that can be used to find a specific field
 * @param  {string} uri
 * @param  {string} path
 * @return {array} of two selectors: one where the editable element is the root component element,
 * and one where the editable element is inside the component
 */
export function fieldSelectors(uri, path) {
  return [`[${refAttr}="${uri}"][${editAttr}="${path}"]`, `[${refAttr}="${uri}"] [${editAttr}="${path}"]`];
}

/**
 * find field element in the dom
 * @param  {string} uri
 * @param  {string} path
 * @return {Element|null}
 */
export function getFieldEl(uri, path) {
  const selectors = fieldSelectors(uri, path);

  return find(selectors[0]) || find(selectors[1]);
}
