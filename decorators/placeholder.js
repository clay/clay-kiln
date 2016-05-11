var _ = require('lodash'),
  references = require('../services/references'),
  label = require('../services/label'),
  dom = require('@nymag/dom'),
  tpl = require('../services/tpl'),
  addComponentHandler = require('../services/add-component-handler');

/**
 * get placeholder text
 * if placeholder has a text property, use it
 * else call the label service
 * @param  {string} path
 * @param  {{}} schema
 * @return {string}
 */
function getPlaceholderText(path, schema) {
  var placeholder = schema[references.placeholderProperty];

  if (_.isObject(placeholder) && placeholder.text) {
    return placeholder.text;
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
 * given an array of fields, find the field that matches a certain name
 * @param {string} name
 * @param {array} value
 * @throws {Error} if no field found (this is a programmer error)
 * @returns {object}
 */
function getFieldFromGroup(name, value) {
  var possibleField = _.find(value, function (field) {
    var currentField = _.get(field, '_schema._name');

    return name === currentField;
  });

  return possibleField;
}

/**
 * determine if a group is empty
 * by looking at the field denoted by the `ifEmpty` property (in the placeholder object)
 * @param {obejct} data
 * @returns {boolean}
 */
function isGroupEmpty(data) {
  var fieldName = _.get(data, '_schema._placeholder.ifEmpty'),
    field = getFieldFromGroup(fieldName, data.value),
    isField = _.has(field, '_schema.' + references.fieldProperty);

  return !!fieldName && isField && isFieldEmpty(field);
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
      listEl: addComponentHandler.getParentListElement(el, options.path)
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
 * @param {boolean} isList
 */
function addPlaceholderList(placeholder, isList) {
  if (isList) {
    dom.find(placeholder, '.placeholder-add-component').classList.remove('kiln-hide');
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
 * @param {{ref: string, path: string, data: object}} options
 * @returns {Element}
 */
function addPlaceholder(el, options) {
  var path = options.path,
    schema = _.get(options, 'data._schema');

  return addPlaceholderDom(el, {
    text: getPlaceholderText(path, schema),
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
