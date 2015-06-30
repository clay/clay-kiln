var _ = require('lodash'),
  references = require('./references'),
  label = require('./label'),
  dom = require('./dom');

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
 * create dom element for the placeholder, add it to the specified node
 * @param {Element} node
 * @param {{ height: string, text: string }} obj
 * @returns {Element} node
 */
function addPlaceholderDom(node, obj) {
  var placeholder = dom.create(`
    <div class="editor-placeholder" style="height: ${obj.height};">
      <span class="placeholder-label">${obj.text}</span>
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
    isPlaceholder = !!schema[references.placeholderProperty],
    isField = !!schema[references.fieldProperty];

  return isPlaceholder && isField && isFieldEmpty(options.data);
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
