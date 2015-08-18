var _ = require('lodash'),
  ds = require('dollar-slice'),
  rivets = require('rivets'),
  references = require('./references'),
  label = require('./label'),
  behaviors = require('./behaviors'),
  dom = require('./dom'),
  currentBindings;

/**
 * ref, data, and data._schema are required for all forms
 * NOTE: Since exceptions are throw if the data is bad, no need to return anything unless we're _modifying_ the data.
 * @param {string} ref
 * @param {object} data
 */
function ensureValidFormData(ref, data) {
  if (!_.isString(ref) || _.isEmpty(ref)) {
    throw new Error('Reference is required to create a form!');
  } else if (!_.isObject(data)) {
    throw new Error('Data is required to create a form!');
  } else if (!_.isObject(data._schema)) {
    throw new Error('Schema is required to create a form!');
  } else if (!_.get(data, '_schema._name')) {
    throw new Error('_name is required to create a form!');
  }
}

// form element creation

function createOverlayEl(innerEl) {
  var el = dom.create(`
    <div class="editor-overlay-background">
      <div class="editor-overlay"></div>
    </div>
  `);

  dom.find(el, '.editor-overlay').appendChild(innerEl);
  return el;
}

function createOverlayFormEl(formLabel, innerEl) {
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
    <section class="editor editor-inline">
      <form>
        <div class="input-container"></div>
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
    el.appendChild(value);
  }
  return el;
}

/**
 * @param {object} data
 * @return {Element}
 */
function createField(data) {
  return behaviors.run(data);
}

/**
 * Iterate through this level of the schema, creating more fields
 *
 * @param {object} data
 * @returns {Element}
 */
function expandFields(data) {
  return _(data.value)
    .map(function (field) {
      return createField(field);
    })
    .reduce(appendElementClones, document.createDocumentFragment());
}

/**
 * @param {string} ref  Place we'll be saving to
 * @param {object} data  The data itself (starting from path)
 * @param {Element} [rootEl=document.body]   Root element to temporarily insert the overlay
 */
function createForm(ref, data, rootEl) {
  var form, schema, name, el;

  ensureValidFormData(ref, data);
  rootEl = rootEl || document.body;
  schema = data._schema;
  name = schema._name; // we're already checking to make sure these exist

  // iterate through the data, creating fields
  if (schema[references.fieldProperty]) {
    // this is a single field
    form = createField(data);
  } else {
    // this is a group of fields
    form = expandFields(data);
  }

  // instantiate data-binding
  _.assign(rivets.binders, form.binders);
  _.assign(rivets.formatters, form.formatters);
  currentBindings = rivets.bind(form.el, form.bindings);

  // build up form el
  el = createOverlayEl(createOverlayFormEl(label(name, schema), form.el));
  // append it to the body
  rootEl.appendChild(el);

  // register + instantiate controllers
  ds.controller('form', require('../controllers/form'));
  ds.controller('overlay', require('../controllers/overlay'));
  ds.get('form', el, ref, name);
  ds.get('overlay', el);
}

/**
 * @param {string} ref  Place we'll be saving to
 * @param {object} data  The data itself (starting from path)
 * @param {Element} oldEl   Root element that is being inline edited
 */
function createInlineForm(ref, data, oldEl) {
  var schema, name, form, newEl, wrapped;

  ensureValidFormData(ref, data);
  schema = data._schema;
  name = schema._name;

  // iterate through the data, creating fields
  if (schema[references.fieldProperty]) {
    // this is a single field
    form = createField(data);
  } else {
    // this is a group of fields
    form = expandFields(data);
  }

  // instantiate data-binding
  _.assign(rivets.binders, form.binders);
  _.assign(rivets.formatters, form.formatters);
  currentBindings = rivets.bind(form.el, form.bindings);

  // build up form el
  newEl = createInlineFormEl(form.el);
  wrapped = dom.wrapElements(_.filter(oldEl.childNodes, function (child) {
    if (child.nodeType === 1) {
      return !child.classList.contains('component-bar');
    } else {
      return true; // always pass through text nodes
    }
  }), 'span');
  wrapped.classList.add('hidden-wrapped');
  oldEl.appendChild(wrapped);
  oldEl.appendChild(newEl);

  // register + instantiate form controller
  ds.controller('form', require('../controllers/form'));
  ds.get('form', newEl, ref, name, oldEl);
}

/**
 * get current bindings
 * used in form-values to get values from the form
 * @returns {object} currentBindings
 */
function getBindings() {
  return currentBindings;
}

module.exports = {
  createForm: createForm,
  createInlineForm: createInlineForm,
  getBindings: getBindings
};
