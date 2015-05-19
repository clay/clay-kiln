'use strict';
var _ = require('lodash'),
  h = require('hyperscript'),
  references = require('./references'),
  edit = require('./edit');

/**
 * get placeholder text
 * if placeholder has a string, use it
 * else use the label if it exists
 * else get the name of the field/group, prettified
 * e.g. "title.social" would become "Title » Social"
 * @param  {string} name     
 * @param  {{}} partials 
 * @return {string}          
 */
function getPlaceholderText(name, partials) {
  var fieldSchema = partials.fieldSchema,
    possiblePlaceholderText = fieldSchema[references.placeholderProperty],
    possibleLabelText = fieldSchema[references.labelProperty];

  if (typeof possiblePlaceholderText === 'string' && possiblePlaceholderText !== 'true') {
    return possiblePlaceholderText;
  } else if (typeof possibleLabelText === 'string') {
    return possibleLabelText;
  } else {
    return name.split('.').map(_.startCase).join(' » ');
  }
}

/**
 * get placeholder height based on the behaviors in a field
 * @param  {string} behaviors
 * @return {string}
 */
function getPlaceholderHeight(behaviors) {
  return _.reduce(behaviors, function (behavior) {
    switch (behavior[references.behaviorKey]) {
      case 'vertical-list': return '600px';
      case 'component': return '300px';
      default: return 'auto';
    }
  });
}

function isFieldEmpty(data) {
  // note: 0, false, etc are valid bits of data for numbers, booleans, etc so they shouldn't be masked
  return data === undefined || data === null || data === '' || (Array.isArray(data) && !data.length);
}

/**
 * create dom element for the placeholder, add it to the specified node
 * @param {NodeElement} node
 * @param {{ height: string, text: string }} obj
 */
function addPlaceholderDom(node, obj) {
  var placeholder = h('.editor-placeholder', { style: { height: obj.height }}, h('span.placeholder-label', obj.text));
  node.appendChild(placeholder);
}

/**
 * generate and add placeholder, if configured
 * placeholder should be shown if:
 * - name is a field and field is blank
 * @param {string} ref
 * @param {NodeElement} node
 */
function addPlaceholder(ref, node) {
  var name = node.getAttribute('name');

  edit.getSchemaAndData(ref, name).then(function (partials) {
    var hasMask = partials.schema[references.placeholderProperty],
      isField = partials.schema[references.fieldProperty];

    if (hasMask && isField && isFieldEmpty(partials.data)) {
      addPlaceholderDom(node, {
        text: getPlaceholderText(name, partials),
        height: getPlaceholderHeight(partials.schema[references.fieldProperty])
      });
    }
  });
}

module.exports = addPlaceholder;

// exported for testing
module.exports.getPlaceholderText = getPlaceholderText;
module.exports.getPlaceholderHeight = getPlaceholderHeight;
module.exports.isFieldEmpty = isFieldEmpty;
module.exports.addPlaceholderDom = addPlaceholderDom;