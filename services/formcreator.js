'use strict';
var h = require('hyperscript'),
  _ = require('lodash'),
  ds = require('dollar-slice'),
  references = require('./references'),
  label = require('./label'),
  shouldDisplay = require('./display'),
  behaviors = require('./behaviors');

// field creation

/**
 * create fields recursively
 * @param  {string} fieldName
 * @param  {{schema: {}, data: {}}} partials
 * @param  {string} [display] flag for entire form
 * @return {NodeElement | undefined}
 */
function createField(fieldName, partials, display) {
  var schema = partials.schema || {},
    data = partials.data || {},
    innerEl, finalEl;

  if (schema[references.fieldProperty] && shouldDisplay(display, schema)) {
    // call behaviors
    return behaviors.run(fieldName, partials);
  } else if (shouldDisplay(display, schema)) {
    // iterate through this level of the schema, creating more fields
    innerEl = document.createDocumentFragment();

    _.forOwn(schema, function (subSchema, subFieldName) {
      if (!_.contains(subFieldName, '_')) { // don't create fields for metadata
        var subData = data[subFieldName],
          subfield = createField(subFieldName, {schema: subSchema, data: subData}, display);

        if (subfield && subfield.nodeType === 1) {
          innerEl.appendChild(subfield); // node element
        } else if (subfield && subfield.nodeType === 11) {
          innerEl.appendChild(subfield.cloneNode(true)); // document fragment
        }
      }
    });

    // once we're done iterating, put those in a section
    finalEl = h('section.editor-section',
      h('h2.editor-section-head', label(fieldName)),
      h('.editor-section-body', innerEl)
    );

    return finalEl;
  }
}

// form element creation

function createModalEl(innerEl) {
  return h('.editor-modal-overlay', h('.editor-modal', innerEl));
}

function createModalFormEl(formLabel, innerEl) {
  return h('section.editor',
    h('header', formLabel),
    h('form',
      h('.input-container', innerEl),
      h('.button-container',
        h('button.save', 'Save')
      )
    )
  );
}

function createInlineFormEl(innerEl) {
  return h('section.editor-inline',
    h('form',
      h('.input-container', innerEl),
      h('.button-container',
        h('button.save', 'Save')
      )
    )
  );
}

// form creation

function ensureValidFormData(name, schema, data) {
  // schema and name are required for all forms
  if (!name) {
    throw new Error('Name is required to create a form!');
  } else if (!schema) {
    throw new Error('Schema is required to create a form!');
  }

  return data || {}; // data defaults to empty object
}

function createForm(name, options) {
  var schema = options.schema,
    ref = options.ref,
    display = options.display || 'modal',
    data = ensureValidFormData(name, schema, options.data),
    innerEl = document.createDocumentFragment(),
    finalEl;

  // iterate through the schema, creating forms and fields
  _.forOwn(schema, function (subSchema, subFieldName) {
    if (!_.contains(subFieldName, '_')) { // don't create fields for metadata
      var subData = data[subFieldName],
        subfield = createField(subFieldName, {schema: subSchema, data: subData}, display);

      if (subfield) {
        innerEl.appendChild(subfield).cloneNode(true);
      }
    }
  });

  // build up form el
  finalEl = createModalEl(createModalFormEl(label(name), innerEl));
  // append it to the body
  document.body.appendChild(finalEl);

  // register + instantiate controllers
  ds.controller('form', require('../controllers/form'));
  ds.controller('modal', require('../controllers/modal'));
  ds.get('form', finalEl.querySelector('form'), ref, name);
  ds.get('modal', finalEl);
}

function createInlineForm(name, options, el) {
  var schema = options.schema,
    ref = options.ref,
    display = options.display || 'modal',
    data = ensureValidFormData(name, schema, options.data),
    innerEl = document.createDocumentFragment();

  // iterate through the schema, creating forms and fields
  _.forOwn(schema, function (subSchema, subFieldName) {
    if (!_.contains(subFieldName, '_')) { // don't create fields for metadata
      var subData = data[subFieldName],
        subfield = createField(subFieldName, {schema: subSchema, data: subData}, display);

      if (subfield) {
        innerEl.appendChild(subfield).cloneNode(true);
      }
    }
  });

  // build up form el
  el.appendChild(createInlineFormEl(innerEl));

  // register + instantiate form controller
  ds.controller('form', require('../controllers/form'));
  ds.get('form', el.querySelector('form'), ref, name);
}

module.exports = {
  createForm: createForm,
  createInlineForm: createInlineForm,

  // for testing
  createField: createField
};