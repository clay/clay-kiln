var _ = require('lodash'),
  references = require('../services/references'),
  label = require('../services/label'),
  dom = require('@nymag/dom'),
  tpl = require('../services/tpl'),
  addComponentHandler = require('../services/components/add-component-handler'),
  interpolate = require('../services/interpolate-fields');

/**
 * given an array of fields, find the field that matches a certain name
 * @param {string} fieldName
 * @param {Array} groupFields
 * @returns {object|undefined}
 */
function getFieldFromGroup(fieldName, groupFields) {
  return _.find(groupFields, field => _.get(field, '_schema._name') === fieldName);
}

/**
 * get placeholder text
 * if placeholder has a text property, use it
 * else call the label service
 * @param {string} path
 * @param {object} data
 * @param {object} data._schema
 * @param {object} componentData
 * @returns {string}
 */
function getPlaceholderText(path, data, componentData) {
  var schema = data._schema,
    placeholder = schema[references.placeholderProperty];

  if (_.isObject(placeholder) && placeholder.text) {
    return interpolate(placeholder.text, componentData);
  } else {
    return label(path, schema);
  }
}

/**
 * get placeholder height
 * @param {Element} parent
 * @param  {object} schema
 * @return {string}
 */
function getPlaceholderHeight(parent, schema) {
  var placeholder = schema[references.placeholderProperty],
    placeholderHeight = placeholder && parseInt(placeholder.height, 10) || 100, // defaults to 100px
    parentHeight = parent && parseInt(getComputedStyle(parent).height);

  if (parentHeight && parentHeight > placeholderHeight) {
    return parentHeight + 'px';
  } else {
    return placeholderHeight + 'px';
  }
}

/**
 * get placeholder permanence
 * @param  {object} schema
 * @return {string}
 */
function getPlaceholderPermanence(schema) {
  var placeholder = schema[references.placeholderProperty];

  return placeholder && !!placeholder.permanent;
}

/**
 * test to see if a field is empty
 * @param {object} data
 * @returns {boolean}
 */
function isFieldEmpty(data) {
  // note: 0, false, etc are valid bits of data for numbers, booleans, etc so they shouldn't be masked
  var value;

  // only fallback to data if value is undefined (not just falsy)
  if (data.hasOwnProperty('value')) {
    value = data.value;
  } else {
    value = data;
  }

  return !_.isBoolean(value) && !_.isNumber(value) && _.isEmpty(value);
}

/**
 * check if a property name is a field, and if it's empty
 * @param {string} name
 * @param {object} data
 * @returns {boolean}
 */
function isFieldAndEmpty(name, data) {
  var field = getFieldFromGroup(name, data.value),
    isField = _.has(field, '_schema.' + references.fieldProperty);

  return isField && isFieldEmpty(field);
}

/**
 * compare two fields to see if they're empty
 * comparators are case insensitive, so AND, and, OR, or, etc work
 * @param {array} tokens must have 3 items
 * @param {object} data
 * @returns {boolean}
 */
function compareTwoFields(tokens, data) {
  var isFirstEmpty = isFieldAndEmpty(tokens[0], data),
    comparator = tokens[1].toLowerCase(), // comparator is case-insensitive
    isSecondEmpty = isFieldAndEmpty(tokens[2], data);

  switch (comparator) {
    case 'and': return isFirstEmpty && isSecondEmpty;
    case 'or': return isFirstEmpty || isSecondEmpty;
    case 'xor': return isFirstEmpty && !isSecondEmpty || !isFirstEmpty && isSecondEmpty;
    default: throw new Error('Unknown comparator: ' + tokens[1]);
  }
}

/**
 * determine if a group is empty
 * by looking at the field(s) denoted by the `ifEmpty` property (in the placeholder object)
 * @param {obejct} data
 * @returns {boolean}
 */
function isGroupEmpty(data) {
  var ifEmpty = _.get(data, '_schema._placeholder.ifEmpty'),
    tokens;

  // if there's no ifEmpty property specified, return false immediately
  if (!ifEmpty) {
    return false;
  }

  // otherwise, tokenize what's there and check the emptiness of the field(s)
  tokens = ifEmpty.split(' ');

  if (tokens.length === 1) {
    // check a single field to see if it's empty
    return isFieldAndEmpty(tokens[0], data);
  } else if (tokens.length === 3) {
    // check multiple fields
    // note: for now this is limited to checking two fields
    // e.g. foo AND bar, foo OR bar, foo XOR bar
    return compareTwoFields(tokens, data);
  } else {
    // someone messed something up in their ifEmpty statement, let them know
    throw new Error('Cannot check if fields are empty: ' + ifEmpty);
  }
}

/**
 * determine if a field is a component list
 * @param {object} options
 * @returns {boolean}
 */
function isComponentList(options) {
  return _.has(options, `data._schema.${references.componentListProperty}`);
}

/**
 * determine if a component list is empty
 * @param {object} data
 * @returns {boolean}
 */
function isComponentListEmpty(data) {
  return data.length === 0;
}

/**
 * get list element, even when we're re-adding placeholders to empty lists
 * when re-running placeholders after deleting all items from a component list,
 * the .component-list-inner div has already been added by the component-list decorator.
 * when we look for the list to add the placeholder, we need to take that into account
 * @param {Element} el
 * @param {string} path
 * @returns {Element}
 */
function getListEl(el, path) {
  var isListInner = el.classList.contains('component-list-inner'),
    parent = isListInner && el.parentNode,
    isParentList = parent && parent.getAttribute(references.editableAttribute) === path;

  if (isParentList) {
    return parent;
  } else {
    return addComponentHandler.getParentEditableElement(el, path);
  }
}

/**
 * get placeholder list, if it exists and is empty
 * @param {Element} el
 * @param {object} options
 * @returns {object|undefined}
 */
function getPlaceholderList(el, options) {
  if (isComponentList(options) && isComponentListEmpty(options.data)) {
    return {
      ref: options.ref,
      path: options.path,
      list: _.get(options, `data._schema.${references.componentListProperty}`),
      listEl: getListEl(el, options.path)
    };
  } // if no empty list, returns undefined
}

/**
 * convert newlines to line breaks
 * @param {string} text
 * @returns {string}
 */
function convertNewLines(text) {
  return text.replace(/(?:\r\n|\r|\n|\\n)/g, '<br />');
}

/**
 * return a different class if a placeholder is permanent
 * @param {boolean} isPermanentPlaceholder
 * @returns {string}
 */
function placeholderClass(isPermanentPlaceholder) {
  return isPermanentPlaceholder ? 'kiln-permanent-placeholder' : 'kiln-placeholder';
}

/**
 * add placeholder class
 * @param {Element} placeholder
 * @param {boolean} isPermanentPlaceholder
 */
function addPlaceholderClass(placeholder, isPermanentPlaceholder) {
  placeholder.firstElementChild.classList.add(placeholderClass(isPermanentPlaceholder));
}

/**
 * add min-height to placeholder
 * @param {Element} placeholder
 * @param {string} height
 */
function addPlaceholderHeight(placeholder, height) {
  placeholder.firstElementChild.style.minHeight = height;
}

/**
 * add text into placeholder, converting newlines
 * @param {Element} placeholder
 * @param {string} text
 */
function addPlaceholderText(placeholder, text) {
  dom.find(placeholder, '.placeholder-label').innerHTML = convertNewLines(text);
}

/**
 * show the add button for placeholders in empty lists
 * @param {Element} placeholder
 * @param {boolean} list
 */
function addPlaceholderList(placeholder, list) {
  if (list) {
    let button = dom.find(placeholder, '.placeholder-add-component');

    button.classList.remove('kiln-hide');
    addComponentHandler(button, list);
  }
}

/**
 * create dom element for the placeholder, add it to the specified node
 * @param {Element} node
 * @param {{ height: string, text: string, permanent: boolean }} obj
 * @returns {Element} node
 */
function addPlaceholderDom(node, obj) {
  var isPermanentPlaceholder = !!obj.permanent,
    list = obj.list,
    placeholder = tpl.get('.placeholder-template');

  addPlaceholderClass(placeholder, isPermanentPlaceholder);
  addPlaceholderHeight(placeholder, obj.height);
  addPlaceholderText(placeholder, obj.text);
  addPlaceholderList(placeholder, list);

  node.appendChild(placeholder);
  return node;
}

/**
 * @param {Element} el
 * @param {{ref: string, path: string, data: object}} options
 * @returns {boolean}
 */
function hasPlaceholder(el, options) {
  var schema = _.get(options, 'data._schema'),
    isPlaceholder = !!schema && !!schema[references.placeholderProperty],
    isPermanentPlaceholder = !!isPlaceholder && getPlaceholderPermanence(schema),
    isField = !!schema && !!schema[references.fieldProperty],
    isGroup = !!schema && !!schema.fields;

  // if it has a placeholder...
  // if it's a permanent placeholder, it always displays
  // if it's a field, make sure it's empty
  // if it's a group, make sure it points to an empty field
  // if it's a component list, make sure it's empty
  if (isPlaceholder && isPermanentPlaceholder) {
    return true;
  } else if (isPlaceholder && isField) {
    return isFieldEmpty(options.data);
  } else if (isPlaceholder && isGroup) {
    return isGroupEmpty(options.data);
  } else if (isPlaceholder && isComponentList(options)) {
    return isComponentListEmpty(options.data);
  } else {
    return false; // not a placeholder
  }
}

/**
 * @param {Element} el
 * @param {{ref: string, path: string, data: object, componentData: object}} options
 * @returns {Element}
 */
function addPlaceholder(el, options) {
  var path = options.path,
    schema = _.get(options, 'data._schema');

  return addPlaceholderDom(el, {
    text: getPlaceholderText(path, options.data, options.componentData),
    height: getPlaceholderHeight(el, schema),
    permanent: getPlaceholderPermanence(schema),
    list: getPlaceholderList(el, options)
  });
}

module.exports.when = hasPlaceholder;
module.exports.handler = addPlaceholder;

// exported for testing
module.exports.getPlaceholderText = getPlaceholderText;
module.exports.getPlaceholderHeight = getPlaceholderHeight;
module.exports.isFieldEmpty = isFieldEmpty;
module.exports.convertNewLines = convertNewLines;
