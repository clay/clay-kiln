var _ = require('lodash'),
  references = require('../services/references'),
  label = require('../services/label'),
  dom = require('../services/dom');

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
 * get placeholder height based on the behaviors in a field
 * @param  {object} schema
 * @return {string}
 */
function getPlaceholderHeight(schema) {
  var placeholder = schema[references.placeholderProperty];

  return placeholder && placeholder.height || '100px';
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
 * determine if a component list is empty
 * @param {object} data
 * @returns {boolean}
 */
function isComponentListEmpty(data) {
  return data.length === 0;
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
 * create dom element for the placeholder, add it to the specified node
 * @param {Element} node
 * @param {{ height: string, text: string }} obj
 * @returns {Element} node
 */
function addPlaceholderDom(node, obj) {
  var placeholder = dom.create(`
    <div class="kiln-placeholder" style="min-height: ${obj.height};">
      <span class="placeholder-label">${convertNewLines(obj.text)}</span>
    </div>
  `);

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
    isField = !!schema && !!schema[references.fieldProperty],
    isGroup = !!schema && !!schema.fields,
    isComponentList = !!schema && !!schema[references.componentListProperty];

  // if it has a placeholder...
  // if it's a field, make sure it's empty
  // if it's a group, make sure it points to an empty field
  // if it's a component list, make sure it's empty
  if (isPlaceholder && isField) {
    return isFieldEmpty(options.data);
  } else if (isPlaceholder && isGroup) {
    return isGroupEmpty(options.data);
  } else if (isPlaceholder && isComponentList) {
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
    height: getPlaceholderHeight(schema)
  });
}

module.exports.when = hasPlaceholder;
module.exports.handler = addPlaceholder;

// exported for testing
module.exports.getPlaceholderText = getPlaceholderText;
module.exports.getPlaceholderHeight = getPlaceholderHeight;
module.exports.isFieldEmpty = isFieldEmpty;
module.exports.convertNewLines = convertNewLines;
