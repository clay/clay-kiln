'use strict';
var _ = require('lodash'),
  ds = require('dollar-slice'),
  references = require('./references'),
  label = require('./label'),
  behaviors = require('./behaviors'),
  dom = require('./dom');

// field creation

/**
 * True if key/value pair is metadata
 *
 * @param {*} value
 * @param {string} key
 * @returns {boolean}
 */
function isMetadata(value, key) {
  return key[0] === '_';
}

/**
 * Schema and name are required for all forms
 * NOTE: Since exceptions are throw if the data is bad, no need to return anything unless we're _modifying_ the data.
 * @param name
 * @param data
 */
function ensureValidFormData(name, data) {
  if (!_.isString(name) || _.isEmpty(name)) {
    throw new Error('Name is required to create a form!');
  } else if (!_.isObject(data)) {
    throw new Error('Data is required to create a form!');
  } else if (!_.isObject(data._schema)) {
    throw new Error('Schema is required to create a form!');
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
          <button type="submit" class="save">Save</button>
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
          <button type="submit" class="save">Save</button>
        </div>
      </form>
    </section>
  `);
  dom.find(el, '.input-container').appendChild(innerEl);
  return el;
}

// form creation

/**
 * @param {Element} el
 * @param {Element} value
 * @returns {*}
 */
function appendElementClones(el, value) {
  if (value && (value.nodeType === 1 || value.nodeType === 11)) {
    el.appendChild(value.cloneNode(true));
  }
  return el;
}

/**
 * Iterate through this level of the schema, creating more fields
 *
 * @param {{display: string, name: string, path: string, data: object}} context
 * @returns {Element}
 */
function expandFields(context) {
  var data = context.data;
  return _(data._schema)
    .omit(isMetadata)
    .pick(_.isObject)
    .map(function (value, name) {
      var path = context.path ? context.path + '.' + name : name;
      return createField({data: data[name], name: name, path: path, display: context.display});
    })
    .reduce(appendElementClones, document.createDocumentFragment());
}

/**
 * create fields recursively
 * @param  {{name: string, display: string, data: object}} context
 * @return {Element | undefined}
 */
function createField(context) {
  var schema = context.data._schema,
    el, finalEl;

  if (schema[references.fieldProperty]) {
    return behaviors.run(context);
  }

  // iterate through this level of the schema, creating more fields
  el = expandFields(context);

  // once we're done iterating, put those in a section
  finalEl = dom.create(`
    <section class="editor-section">
      <h2 class="editor-section-head">${label(context.name, schema)}</h2>
      <div class="editor-section-body">
    </section>
  `);
  dom.find(finalEl, '.editor-section-body').appendChild(el);

  return finalEl;
}

/**
 *
 * @param {string} name
 * @param {object} data
 * @param {Element} [rootEl=document.body]   Root element to temporarily insert the modal
 */
function createForm(name, data, rootEl) {
  ensureValidFormData(name, data);
  rootEl = rootEl || document.body;

  // iterate through first level of the schema, creating forms and fields
  var el = expandFields({
    data: data,
    name: name,
    display: data._schema[references.displayProperty] || 'modal'
  });

  // build up form el
  el = createModalEl(createModalFormEl(label(name, data._schema), el));
  // append it to the body
  rootEl.appendChild(el);

  // register + instantiate controllers
  ds.controller('form', require('../controllers/form'));
  ds.controller('modal', require('../controllers/modal'));
  ds.get('form', el, data[references.referenceProperty], name);
  ds.get('modal', el);
}

/**
 * @param {string} name
 * @param {object} data
 * @param {Element} el
 */
function createInlineForm(name, data, el) {
  ensureValidFormData(name, data);

  var innerEl,
    schema = data._schema,
    oldEl = el.cloneNode(true),
    isField = !!schema[references.fieldProperty],
    context = {
      data: data,
      name: name,
      display: 'inline'
    };

  if (isField) {
    innerEl = createField(context);
  } else {
    innerEl = expandFields(context);
  }

  // build up form el
  dom.clearChildren(el);
  dom.prependChild(el, createInlineFormEl(innerEl));

  // register + instantiate form controller
  ds.controller('form', require('../controllers/form'));
  ds.get('form', el, data[references.referenceProperty], name, oldEl);
}

module.exports = {
  createForm: createForm,
  createInlineForm: createInlineForm
};