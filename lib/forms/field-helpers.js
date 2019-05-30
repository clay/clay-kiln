import _ from 'lodash';
import { set } from 'caret-position';
import { decode } from 'he';
import striptags from 'striptags';
import { closest, find } from '@nymag/dom';
import { fieldClass, firstFieldClass } from '../utils/references';
import { isEmpty, compare } from '../utils/comparators';
import { filterBySite } from '../utils/site-filter';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * find the field element a behavior is inside
 * @param  {Element} el
 * @return {Element}
 */
export function getField(el) {
  return closest(el, `.${fieldClass}`);
}

/**
 * DEPRECATED
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
 * @param {Element} el of input (something that can get a caret set in it) or el containing an input
 * @param {number} offset
 * @param {number} [data] if passed a negative offset
 */
export function setCaret(el, offset, data) {
  const inputEl = _.isFunction(el.createTextRange) ? el : find(el, 'input');

  data = data || '';

  if (offset === -1) {
    // set caret at the end if it's negative
    // todo: maybe support arbitrary negative offsets?
    offset = data.length - 1;
  }

  // set the offset, but fail gracefully
  try {
    set(inputEl, offset);
  } catch (e) {
    log.debug(`Cannot set caret in field: ${e.message}`, { action: 'setCaret', el });
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

/**
 * generate error messages from validation rules,
 * specifying default error messages
 * @param  {object} [validate]
 * @param {boolean} [isLengthy]
 * @return {object}
 */
function errorMessages(validate = {}, isLengthy) {
  return {
    required: validate.requiredMessage || 'Please fill out this field',
    min: validate.minMessage || isLengthy ? `Please enter at least ${validate.min} characters` : `Please enter a value of ${validate.min} or above`,
    max: validate.maxMessage || isLengthy ? `Please enter fewer than ${validate.max + 1} characters` : `Please enter a value of ${validate.max} or below`,
    pattern: validate.patternMessage || `Please match the pattern "/${validate.pattern}/ig"`
  };
}

/**
 * determine if a field should be required
 * @param  {object} validate
 * @param  {object} store
 * @param  {string} name
 * @return {Boolean}
 */
export function shouldBeRequired(validate, store, name) {
  if (_.isObject(validate) && _.isObject(validate.required)) {
    const field = validate.required.field,
      operator = validate.required.operator,
      values = validate.required.values,
      value = validate.required.value,
      uri = _.get(store, 'state.ui.currentForm.uri'),
      compareData = getFieldData(store, field, name, uri);

    if (!_.isEmpty(values)) {
      // compare against multiple values. will return true if any of them match
      return _.some(values, (v) => compare({ data: compareData, operator, value: v }));
    } else {
      // compare against a single value (note: value might be undefined if we're comparing with certain operators)
      return compare({ data: compareData, operator, value });
    }
  }
}

/**
 * remove tags and decode entities, so we can check the length of strings
 * @param  {string} value
 * @return {string}
 */
function cleanValue(value) {
  return decode(striptags(_.isString(value) ? value : ''));
}

/**
 * determine if a field is valid, based on the validation rules
 * @param  {*}  data
 * @param  {object|undefined}  validate
 * @param {object} store
 * @param {string} name
 * @return {string|null}
 */
export function getValidationError(data, validate, store, name) { // eslint-disable-line
  const isFieldEmpty = isEmpty(data),
    isLengthy = _.isString(data) || _.isArray(data),
    messages = errorMessages(validate, isLengthy),
    strValue = _.isString(data) && cleanValue(data);

  let length;

  if (!_.isObject(validate)) {
    return null; // if no validation rules, it's always valid
  }

  // if we're dealing with strings or arrays, we'll want to check min/max against the length
  // (if it's numbers, dates, or other things, we want to check min/max against the value directly)
  if (isLengthy) {
    length = (strValue || data).length;
  }

  if (isFieldEmpty && validate.required === true) {
    // validate required fields first
    return messages.required;
  } else if (isFieldEmpty && _.isObject(validate.required)) {
    return shouldBeRequired(validate, store, name) ? messages.required : null;
  } else if (!isFieldEmpty && validate.pattern && !strValue.match(new RegExp(validate.pattern, 'ig'))) {
    return messages.pattern;
  } else if (!isFieldEmpty && isLengthy) {
    // if we're checking stuff with lengths (strings + arrays),
    // DON'T check for values against min/max
    if (validate.min && length < validate.min) {
      return messages.min;
    } else if (validate.max && length > validate.max) {
      return messages.max;
    }
  } else if (!isFieldEmpty && validate.min && data < validate.min) {
    return messages.min;
  } else if (!isFieldEmpty && validate.max && data > validate.max) {
    return messages.max;
  }
}

/**
 * determine if something should be revealed based on the sites specified
 * and the current site
 * @param  {string} sites
 * @param  {string} currentSlug
 * @return {boolean}
 */
function shouldBeRevealedBySite(sites, currentSlug) {
  return !!filterBySite([{ sites }], currentSlug).length;
}

/**
 * determine if something should be revealed based on another field's data
 * @param  {*} data
 * @param  {string} operator
 * @param  {*} value if we want to reveal based on a single value
 * @param  {array} values if we want to reveal based on multiple values
 * @return {boolean}
 */
function shouldBeRevealedByData(data, operator, value, values) {
  if (!_.isEmpty(values)) {
    // compare against multiple values. will return true if any of them match
    return _.some(values, (v) => compare({ data, operator, value: v }));
  } else {
    // compare against a single value (note: value might be undefined if we're comparing with certain operators)
    return compare({ data, operator, value });
  }
}

/**
 * determine if a field / option / etc should be revealed
 * (based on the config from _reveal)
 * @param  {object} store
 * @param  {object} config
 * @param  {string} name   of field
 * @return {boolean}
 */
export function shouldBeRevealed(store, config, name) {
  const currentSlug = _.get(store, 'state.site.slug'),
    uri = _.get(store, 'state.ui.currentForm.uri'),
    field = config && config.field,
    operator = config && config.operator,
    value = config && config.value,
    values = config && config.values || [],
    sites = config && config.sites,
    data = config && getFieldData(store, field, name, uri);

  if (sites && field) {
    // if there is site logic, run it before field logic
    // and return a boolean based on both checks
    return shouldBeRevealedBySite(sites, currentSlug) && shouldBeRevealedByData(data, operator, value, values);
  } else if (sites) {
    // only check the site logic
    return shouldBeRevealedBySite(sites, currentSlug);
  } else if (field) {
    // only check field logic
    return shouldBeRevealedByData(data, operator, value, values);
  } else {
    return true; // show the field if no _reveal config
  }
}
