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
  if (typeof data.value !== 'undefined') {
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
 * generate and add placeholder, if configured
 * placeholder should be shown if:
 * - name is a field and field is blank
 * @param {string} ref
 * @param {Element} node
 * @returns {Element} node
 */
function addPlaceholder(ref, node) {
  var path = node.getAttribute('name');

  return edit.getData(ref).then(function (data) {
    var schema, field, hasPlaceholder, isField;

    data = _.get(data, path);
    schema = data._schema;
    field = schema[references.fieldProperty];
    hasPlaceholder = schema[references.placeholderProperty];
    isField = !!field;

    if (hasPlaceholder && isField && isFieldEmpty(data)) {
      return addPlaceholderDom(node, {
        text: getPlaceholderText(path, schema),
        height: getPlaceholderHeight(field) // todo: change to be better, remove access to this function.
      });
    } else {
      return node;
    }
  });
}

module.exports = addPlaceholder;

// exported for testing
module.exports.getPlaceholderText = getPlaceholderText;
module.exports.getPlaceholderHeight = getPlaceholderHeight;
module.exports.isFieldEmpty = isFieldEmpty;
