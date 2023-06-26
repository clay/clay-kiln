import Vue from 'vue';
import _ from 'lodash';
import { prependChild } from '@nymag/dom';
import store from '../core-data/store';
import {
  editAttr, placeholderAttr, placeholderProp, fieldProp, componentListProp, componentProp
} from '../utils/references';
import { get } from '../core-data/groups';
import { isEmpty } from '../utils/comparators';
import placeholderTpl from './placeholder.vue';

const Placeholder = Vue.component('placeholder', placeholderTpl),
  placeholders = {};


/**
 * check if a field is empty using either a single field name
 * or a path for a single prop inside a complex-list field
 *
 * example:
 * isFieldEmpty({ name: 'clay' }, 'name') will operate of the field called 'name'
 * isFieldEmpty({ content: [{ name: '' }] }, 'content.name') will operate on the 'name' field in each item in the 'content' array
 *
 * @param {object} fields object with data for all fields
 * @param {string} fieldName name or path of field to check
 * @returns {boolean}
 */
export function isFieldEmpty(fields, fieldName) {
  const path = fieldName.split('.'),
    field = _.head(path);

  let value;

  // to avoid complexity we're just checking first-level fields for now
  if (path.length > 2) {
    throw new Error(`Complex-list deep field comparison must be 2 or fewer fields deep. Token '${fieldName}' is ${path.length} fields deep.`);
  }

  if (path.length === 2) {
    // make sure field is an array
    if (!_.isArray(fields[field])) {
      throw new Error(`Deep field comparison can only be used on complex-list fields. ${field} is of type ${typeof fields[field]}.`);
    }

    // compose a fake complex-list with only the property we're looking to test
    value = _.map(fields[field], item => _.pick(item, _.last(path)));
  } else {
    // behave normally if we're looking at a top-level field
    value = fields[fieldName];
  }

  return isEmpty(value);
}

/**
 * compare multiple fields to see if they're empty
 * note: comparators are case insensitive, so 'AND', 'and', 'OR', 'or', etc work
 * note: when comparing more than two fields, the same comparators must be used
 * (e.g. 'foo and bar and baz', not 'foo and bar or baz')
 * @param {array} tokens array of alternating fields and comparators, beginning with a field
 * @param {object} fields object with data for all fields
 * @param {string} statement from ifEmpty, used for giving more information to error messages
 * @returns {boolean}
 */
export function compareFields(tokens, fields, statement) {
  const fieldNames = _.filter(tokens, (token, index) => index % 2 === 0), // first, third, etc item (in 0-indexed array)
    // map through all fields, determining if each is empty
    fieldBooleans = _.map(fieldNames, fieldName => isFieldEmpty(fields, fieldName)),
    // filter tokens to get comparators, then lowercase them
    comparators = _.map(_.filter(tokens, (token, index) => index % 2 === 1), token => token.toLowerCase()),
    // remove duplicates (if they're all the same comparator, the resulting array should have one item after going through _.uniq)
    uniqueComparators = _.uniq(comparators);

  let comparator;

  if (fieldNames.length !== comparators.length + 1) {
    // there are either too many comparators, or too many fields
    throw new Error(`'ifEmpty' statement has mismatched fields and comparators! You provided: '${statement}'`);
  }

  if (comparators.length > 1 && _.includes(comparators, 'xor')) {
    // logically, only two boolean values can be compared with xor
    throw new Error(`'ifEmpty' statement only supports comparing two fields with XOR! You provided: '${statement}'`);
  }

  if (uniqueComparators.length > 1) {
    // there's more than one 'unique' comparator! this means the fields are being compared
    // with _different_ comparators, rather than the same comparator
    throw new Error(`'ifEmpty' statement only supports using identical comparators! You provided: '${statement}'`);
  }

  // if we didn't make any mistakes above, then set the comparator and the compareFn
  comparator = _.head(uniqueComparators);
  switch (comparator) {
    case 'and': return _.every(fieldBooleans, bool => bool === true);
    case 'or': return _.some(fieldBooleans, bool => bool === true);
    case 'xor': return fieldBooleans[0] && !fieldBooleans[1] || !fieldBooleans[0] && fieldBooleans[1];
    default: throw new Error(`Unknown comparator: ${comparator}`);
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
    return isFieldEmpty(fields, _.head(tokens));
  } else {
    // check multiple fields
    return compareFields(tokens, fields, ifEmpty);
  }
}

/**
 * test to see if a component property is empty
 * @param  {array|string}  field (string means it's an alias to a page area)
 * @param {object} storeOverride for testing
 * @return {Boolean}
 */
function isComponentListEmpty(field, storeOverride) {
  if (_.isString(field)) {
    // list is in the page! fetch the page data
    return _.isEmpty(_.get(storeOverride, `state.page.data['${field}']`, []));
  } else {
    // list is in the component / layout
    return _.isEmpty(field);
  }
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
 * @param {object} storeOverride for testing
 * @return {Boolean}
 */
export function hasPlaceholder(uri, path, storeOverride = store) {
  const group = get(uri, path),
    schema = group ? group.schema : null,
    placeholder = schema && schema[placeholderProp],
    isPermanentPlaceholder = placeholder && !!placeholder.permanent;

  // if there isn't a placeholder at all, return negative quickly
  // since we're ususally checking a bunch of fields/groups
  // if it has a placeholder...
  // if it's a permanent placeholder, it always displays
  // if it's a field, make sure it's empty
  // if it's a group, make sure it points to an empty field
  // if it's a component list, make sure it's empty
  // if it's a component prop, make sure it's empty
  if (!placeholder) {
    return false;
  } else if (isPermanentPlaceholder) {
    return true;
  } else {
    return returnPlaceHolder(uri, path, storeOverride);
  }
}

/**
 * Helper function for hasPlaceholder()
 * @param  {string}  uri
 * @param  {string}  path to field/group
 * @param {object} storeOverride for testing
 * @return {Boolean}
 */
function returnPlaceHolder(uri, path, storeOverride = store) {
  const group = get(uri, path),
    { fields = null, schema = null } = group,
    placeholder = schema && schema[placeholderProp],
    isField = schema && !!schema[fieldProp],
    isGroup = schema && !!schema.fields,
    isComponentList = schema && !!schema[componentListProp],
    isCollapsibleList = isComponentList && !!_.get(schema, `${componentListProp}.collapse`),
    isComponentProp = schema && !!schema[componentProp];

  if (isField) {
    return isFieldEmpty(fields, path);
  } else if (isGroup) {
    return isGroupEmpty(fields, placeholder, path);
  } else if (isComponentList) {
    return isCollapsibleList || isComponentListEmpty(fields[path], storeOverride);
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

  prependChild(el, placeholder.$el);

  // hold on to placeholders, so we can destroy them when re-rendering components
  if (placeholders[uri]) {
    placeholders[uri].push(placeholder);
  } else {
    placeholders[uri] = [placeholder];
  }
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

/**
 * remove placeholders when re-rendering components
 * @param  {string} uri
 */
export function destroyPlaceholders(uri) {
  if (placeholders[uri]) {
    _.each(placeholders[uri], placeholder => placeholder.$destroy());
    placeholders[uri] = null;
  }
}
