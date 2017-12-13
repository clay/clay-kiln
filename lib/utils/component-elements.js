import _ from 'lodash';
import { closest, findAll, find } from '@nymag/dom';
import { refAttr, editAttr, layoutAttr, hiddenAttr, pageAreaClass } from './references';

/**
 * Get the closest component element from the DOM. Checks self and then parents.
 * note: getting from a uri assumes an instance of a component is used ONCE on the page
 * (it returns the first element that matches that particular instance)
 * @param {Element|string} el    Any element within a component, or the component's uri
 * @returns {Element|undefined}
 */
export function getComponentEl(el) {
  return _.isString(el) ? find(`[${refAttr}="${el}"]`) :  el && closest(el, `[${refAttr}]`);
}

/**
 * Get the closest parent component of the component from the DOM.
 * if the component has no parentNode (e.g. it's outside the DOM, being re-rendered),
 * search for the component in the dom before finding the parent
 * @param {Element} el  A component element
 * @returns {Element}
 */
export function getParentComponent(el) {
  if (el.parentNode) {
    return getComponentEl(el.parentNode) || getLayout().el;
  } else {
    const uri = el.getAttribute(refAttr),
      domEl = find(`[${refAttr}="${uri}"]`);

    return domEl && domEl.parentNode && getComponentEl(domEl.parentNode) || getLayout().el;
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
 * @return {array} of three selectors: one where the editable element is the root component element,
 * one where the editable element is inside the component,
 * and one that simply matches the editable field (to match editable component lists in the layout)
 */
export function fieldSelectors(uri, path) {
  return [`[${refAttr}="${uri}"][${editAttr}="${path}"]`, `[${refAttr}="${uri}"] [${editAttr}="${path}"]`, `[${editAttr}="${path}"]`];
}

/**
 * find field element in the dom
 * @param  {string} uri
 * @param  {string} path
 * @return {Element|null}
 */
export function getFieldEl(uri, path) {
  const selectors = fieldSelectors(uri, path),
    el = find(selectors[0]) || find(selectors[1]); // find field in normal components

  if (el) {
    return el;
  } else {
    // attempt to find field in layout,
    // by checking all the fields that match and returning the first one
    // that is NOT inside a component (the field whose closest data-uri node is actually <html>)
    return _.find(findAll(selectors[2]), (fieldEl) => closest(fieldEl, `[${refAttr}]`) === document.firstElementChild);
  }
}

/**
 * determine if a component is in the page or layout
 * @param  {string}  uri
 * @return {Boolean}
 */
export function isComponentInPage(uri) {
  const el = find(`[${refAttr}="${uri}"]`);

  if (el) {
    const pageArea = closest(el, `.${pageAreaClass}`);

    return !!pageArea;
  } else {
    return false;
  }
}
