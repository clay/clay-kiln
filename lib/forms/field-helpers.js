import _ from 'lodash';
import { set } from 'caret-position';
import { closest, find } from '@nymag/dom';
import { fieldClass, mainBehaviorClass, firstFieldClass } from '../utils/references';

/**
 * find the field element a behavior is inside
 * @param  {Element} el
 * @return {Element}
 */
export function getField(el) {
  return closest(el, `.${fieldClass}`);
}

/**
 * find main input of a field
 * @param  {element} el
 * @return {Element|null}
 */
export function getInput(el) {
  const field = getField(el),
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
  const field = getField(el);

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

/**
 * find data in the same list item, recursing upwards in case we're inside
 * multiple complex-lists
 * @param  {object} data
 * @param  {string} prop
 * @param  {string} path
 * @return {*}
 */
function findDataInList(data, prop, path) {
  const pathArray = path.split('.');

  let found = null,
    i = pathArray.length - 1;

  for (; i >= 0; i--) {
    const part = pathArray[i];

    if (!_.isNaN(_.toNumber(part))) {
      // this is inside an array! that means it's in a complex list
      const beforeIndex = pathArray.slice(0, i).join('.'),
        index = part;

      found = _.get(data, `${beforeIndex}.${index}.${prop}`);
      if (found) {
        break;
      }
    }
  }

  return found;
}

/**
 * get data from a field
 * looks inside current complex-list item first,
 * then up to other lists this may be inside,
 * then looks in the current form,
 * then (finally) looks in the component data
 * @param  {object} store
 * @param  {string} prop to look for
 * @param  {string} path of current field (to check for nested complex-lists)
 * @param {string} uri to check inside current component
 * @return {*}
 */
export function getFieldData(store, prop, path, uri) {
  const currentFormData = _.get(store, 'state.ui.currentForm.fields', {}),
    insideComplexLists = path.match(/\.\d+\./); // determine if a field is inside an array

  if (insideComplexLists) {
    // inside one (or more) complex lists
    let found = findDataInList(currentFormData, prop, path);

    if (found) {
      return found;
    }
  }

  // if we haven't found anything, check to see if it's in the current form (or component data)
  if (_.includes(Object.keys(currentFormData), prop)) {
    // inside current form
    return currentFormData[prop];
  } else {
    // inside the component data
    return _.get(store, `state.components['${uri}'].${prop}`);
  }
}
