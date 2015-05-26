'use strict';
var _ = require('lodash'),
  ds = require('dollar-slice'),
  references = require('./references'),
  label = require('./label'),
  shouldDisplay = require('./display'),
  behaviors = require('./behaviors'),
  dom = require('./dom');

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
          subfield = createField(subFieldName, {schema: subSchema, data: subData, path: partials.path + '.' + subFieldName}, display);

        if (subfield && subfield.nodeType === 1) {
          innerEl.appendChild(subfield); // node element
        } else if (subfield && subfield.nodeType === 11) {
          innerEl.appendChild(subfield.cloneNode(true)); // document fragment
        }
      }
    });

    // once we're done iterating, put those in a section
    finalEl = dom.create(`
      <section class="editor-section">
        <h2 class="editor-section-head">${label(fieldName, schema)}</h2>
        <div class="editor-section-body">
      </section>
    `);
    dom.find(finalEl, '.editor-section-body').appendChild(innerEl);

    return finalEl;
  }
}

// form element creation

function createModalEl(innerEl) {
  var el = dom.create(`
    <div class="editor-modal-overlay">
      <div class="editor-modal"></div>
    </div>
  `);
  dom.find(el, '.editor-modal').appendChild(innerEl);
  return el;
}

function createModalFormEl(formLabel, innerEl) {
  var el = dom.create(`
    <section class="editor">
      <header>${formLabel}</header>
      <form>
        <div class="input-container"></div>
        <div class="button-container">
          <button class="save">Save</button>
        </div>
      </form>
    </section>
  `);
  dom.find(el, '.input-container').appendChild(innerEl);
  return el;
}

function createInlineFormEl(innerEl) {
  var el = dom.create(`
    <section class="editor-inline">
      <form>
        <div class="input-container"></div>
        <div class="button-container">
          <button class="save">Save</button>
        </div>
      </form>
    </section>
  `);
  dom.find(el, '.input-container').appendChild(innerEl);
  return el;
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
        subfield = createField(subFieldName, {schema: subSchema, data: subData, path: subFieldName}, display);

      if (subfield) {
        innerEl.appendChild(subfield).cloneNode(true);
      }
    }
  });

  // build up form el
  finalEl = createModalEl(createModalFormEl(label(name, schema), innerEl));
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
    display = 'inline',
    data = ensureValidFormData(name, schema, options.data),
    innerEl = document.createDocumentFragment();

  if (schema._has) {
    innerEl = createField(name, { schema: schema, data: data, path: name }, display);
  } else {
    // iterate through the schema, creating forms and fields
    _.forOwn(schema, function (subSchema, subFieldName) {
      if (!_.contains(subFieldName, '_')) { // don't create fields for metadata
        var subData = data[subFieldName],
          subfield = createField(subFieldName, {schema: subSchema, data: subData, path: subFieldName}, display);

        if (subfield) {
          innerEl.appendChild(subfield);
        }
      }
    });
  }

  // build up form el
  dom.clearChildren(el);
  dom.prependChild(el, createInlineFormEl(innerEl));

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