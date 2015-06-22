var _ = require('lodash'),
  references = require('./references'),
  edit = require('./edit'),
  label = require('./label'),
  dom = require('./dom'),
  getExpandedBehaviors = require('./behaviors').getExpandedBehaviors;

/**
 * get placeholder text
 * if placeholder has a string, use it
 * else call the label service
 * @param  {string} path
 * @param  {{}} schema
 * @return {string}
 */
function getPlaceholderText(path, schema) {
  var possiblePlaceholderText = schema[references.placeholderProperty];

  if (typeof possiblePlaceholderText === 'string' && possiblePlaceholderText !== 'true') {
    return possiblePlaceholderText;
  } else {
    return label(path, schema);
  }
}

/**
 * get placeholder height based on the behaviors in a field
 * @param  {string} behaviors
 * @return {string}
 */
function getPlaceholderHeight(behaviors) {
  // expand the behaviors into an array of objects
  var expanded = getExpandedBehaviors(behaviors);

  return _.reduce(expanded, function (height, behavior) {
    if (height === 'auto') {
      switch (behavior[references.behaviorKey]) {
        case 'vertical-list': return '600px';
        case 'component': return '300px';
        default: return 'auto';
      }
    } else {
      return height;
    }
  }, 'auto');
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
    schema = _.get(options, 'data._schema'),
    behaviors = schema[references.fieldProperty];

  return addPlaceholderDom(el, {
    text: getPlaceholderText(path, schema),
    height: getPlaceholderHeight(behaviors) // todo: change to be better, remove access to this function.
  });
}

module.exports.when = hasPlaceholder;
module.exports.handler = addPlaceholder;

// exported for testing
module.exports.getPlaceholderText = getPlaceholderText;
module.exports.getPlaceholderHeight = getPlaceholderHeight;
module.exports.isFieldEmpty = isFieldEmpty;
