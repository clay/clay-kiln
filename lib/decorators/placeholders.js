import Vue from 'vue';
import _ from 'lodash';
import { editAttr, placeholderAttr, placeholderProp, fieldProp, componentListProp, componentProp } from '../utils/references';
import { get } from '../core-data/groups';
import placeholderTpl from './placeholder.vue';

const Placeholder = Vue.component('placeholder', placeholderTpl);

/**
 * test to see if a field is empty
 * note: 0, false, etc are valid bits of data for numbers, booleans, etc so they shouldn't be masked
 * note: but emptystring IS empty (for strings)
 * @param  {*}  data
 * @return {Boolean}
 */
export function isFieldEmpty(data) {
  return !_.isBoolean(data) && !_.isNumber(data) && _.isEmpty(data);
}

/**
 * compare two fields to see if they're empty
 * comparators are case insensitive, so 'AND', 'and', 'OR', 'or', etc work
 * @param {array} tokens must have 3 items: first field, comparator, second field
 * @param {object} fields
 * @returns {boolean}
 */
export function compareTwoFields(tokens, fields) {
  const isFirstEmpty = isFieldEmpty(fields[_.head(tokens)]),
    comparator = tokens[1].toLowerCase(), // comparator is case-insensitive
    isSecondEmpty = isFieldEmpty(fields[_.last(tokens)]);

  switch (comparator) {
    case 'and': return isFirstEmpty && isSecondEmpty;
    case 'or': return isFirstEmpty || isSecondEmpty;
    case 'xor': return isFirstEmpty && !isSecondEmpty || !isFirstEmpty && isSecondEmpty;
    default: throw new Error('Unknown comparator: ' + tokens[1]);
  }
}

/**
 * test to see if a group is empty
 * @param  {object}  fields
 * @param  {object}  placeholder
 * @param  {string}  path for error message
 * @return {Boolean}
 */
export function isGroupEmpty(fields, placeholder, path) {
  const ifEmpty = placeholder.ifEmpty;

  let tokens;

  if (!ifEmpty || !_.isString(ifEmpty)) {
    throw new Error(`Placeholder for group '${path}' needs 'ifEmpty' statement!`);
  }

  // tokenize the `ifEmpty` statement and check the emptiness of the field(s)
  tokens = ifEmpty.split(' ');

  if (tokens.length === 1) {
    // check a single field to see if it's empty
    return isFieldEmpty(fields[_.head(tokens)]);
  } else if (tokens.length === 3) {
    // check multiple fields
    // note: for now (because order of operations is non-trivial and I'm lazy)
    // this is limited to checking two fields.
    // e.g. foo AND bar, foo OR bar, foo XOR bar
    // feel free to make a pull request if you want to compare more than two fields!
    return compareTwoFields(tokens, fields);
  } else {
    // someone messed something up in their ifEmpty statement, let them know
    throw new Error(`Too many arguments in 'ifEmpty' statement! (${ifEmpty})`);
  }
}

/**
 * test to see if a component property is empty
 * @param  {array|string}  field (string means it's an alias to a page area)
 * @return {Boolean}
 */
function isComponentListEmpty(field) {
  return _.isEmpty(field);
  // todo: I'm not sure if this will work for page areas in layouts,
  // so please test against that before releasing
}

/**
 * test to see if a component property is empty
 * @param  {object}  field
 * @return {Boolean}
 */
function isComponentPropEmpty(field) {
  return _.isEmpty(field);
}

/**
 * determine if a placeholder is needed
 * @param  {string}  uri
 * @param  {string}  path to field/group
 * @return {Boolean}
 */
export function hasPlaceholder(uri, path) {
  const group = get(uri, path),
    fields = group.fields,
    schema = group.schema,
    placeholder = schema && schema[placeholderProp],
    isPermanentPlaceholder = placeholder && !!placeholder.permanent,
    isField = schema && !!schema[fieldProp],
    isGroup = schema && !!schema.fields,
    isComponentList = schema && !!schema[componentListProp],
    isComponentProp = schema && !!schema[componentProp];

  // if there isn't a placeholder at all, return negative quickly
  // since we're ususally checking a bunch of fields/groups
  if (!placeholder) {
    return false;
  }

  // if it has a placeholder...
  // if it's a permanent placeholder, it always displays
  // if it's a field, make sure it's empty
  // if it's a group, make sure it points to an empty field
  // if it's a component list, make sure it's empty
  // if it's a component prop, make sure it's empty
  if (isPermanentPlaceholder) {
    return true;
  } else if (isField) {
    return isFieldEmpty(fields[path]);
  } else if (isGroup) {
    return isGroupEmpty(fields, placeholder, path);
  } else if (isComponentList) {
    return isComponentListEmpty(fields[path], uri, path);
  } else if (isComponentProp) {
    return isComponentPropEmpty(fields[path]);
  } else {
    throw new Error(`Could not determine if I should add a placeholder for ${path} (in ${uri})`);
  }
}

/**
 * create a new vue placeholder and add it
 * @param {string} uri
 * @param {string} path
 * @param {Element} el
 */
export function addPlaceholder(uri, path, el) {
  const parentHeight = getComputedStyle(el).height,
    placeholder = new Placeholder({ uri, path, parentHeight }).$mount();

  el.appendChild(placeholder.$el);
}

/**
 * add placeholders if they're needed
 * @param  {string} uri
 * @param  {element} el with data-editable / data-placeholder
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr) || el.getAttribute(placeholderAttr);

  if (hasPlaceholder(uri, path)) {
    addPlaceholder(uri, path, el);
  }
}
