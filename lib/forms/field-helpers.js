import { set } from 'caret-position';
import { closest, find } from '@nymag/dom';
import { fieldClass, mainBehaviorClass, firstFieldClass } from '../utils/references';

/**
 * find main input of a field
 * @param  {element} el
 * @return {Element|null}
 */
export function getInput(el) {
  const field = closest(el, `.${fieldClass}`),
    main = field && find(field, `.${mainBehaviorClass}`);

  return main && (find(main, 'input') || find(main, 'textarea') || find(main, '.wysiwyg-input'));
}

/**
 * determine if a behavior is in the first field of a form
 * note: this is used for setting the caret
 * @param  {Element}  el of the behavior
 * @return {Boolean}
 */
export function isFirstField(el) {
  const field = closest(el, `.${fieldClass}`);

  return field && field.classList.contains(firstFieldClass);
}

/**
 * set the caret into a field
 * @param {Element} el
 * @param {number} offset
 * @param {number} [data] if passed a negative offset
 */
export function setCaret(el, offset, data) {
  data = data || '';

  if (offset === -1) {
    // set caret at the end if it's negative
    // todo: maybe support arbitrary negative offsets?
    set(el, data.length - 1);
  } else {
    set(el, offset);
  }
}
