import _ from 'lodash';
import { closest } from '@nymag/dom';
import { refAttr, layoutAttr } from './references';

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
