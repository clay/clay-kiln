import { closest } from '@nymag/dom';
import { refAttr, layoutAttr } from './references';

/**
 * Get the closest component element from the DOM. Checks self and then parents.
 * @param {Element} el    Any element within a component.
 * @returns {Element}
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
