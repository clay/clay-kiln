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
  } else if (!_.get(data, '_schema')) {
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
      <form>
        <header>
          <span class="form-header">${formLabel}</span>
          <button type="submit" class="save">Save</button>
        </header>
        <div class="input-container"></div>
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
        <button type="submit" class="hidden-submit"></button>
      </form>
    </section>
  `);

  dom.find(el, '.input-container').appendChild(innerEl);
  return el;
}

// form creation

/**
 * @param {object} form
 * @param {object} field
 * @returns {object}
 */
function appendElementClones(form, field) {
  var el = form.el,
    fieldEl = field.el,
    fieldName = field.name;

  // add field bindings
  form.bindings[fieldName] = field.bindings;
  // add field formatters (if they don't exist)
  _.defaults(form.formatters, field.formatters);
  // add field binders (if they don't exist)
  _.defaults(form.binders, field.binders);

  // append field el to form
  if (fieldEl && (fieldEl.nodeType === 1 || fieldEl.nodeType === 11)) {
    el.appendChild(fieldEl);
  }
  return form;
}

/**
 * generate new form object
 * @returns {object}
 */
function newForm() {
  return {
    el: document.createDocumentFragment(),
    binders: {}, // binders like simple-list and wysiwyg modify values
    formatters: {}, // formatters like soft-maxlength format text
    bindings: {} // bindings is a hash of all bindings for each field + behaviors
  };
}

/**
 * create a single field
 * @param {object} data
 * @return {Promise}
 */
function createField(data) {
  return behaviors.run(data)
    .then(function (field) {
      return appendElementClones(newForm(), field);
    });
}

/**
 * Iterate through this level of the schema, creating multiple fields
 *
 * @param {object} data
 * @returns {Promise}
 */
function expandFields(data) {
  return Promise.all(_.map(data.value, function (field) {
    return behaviors.run(field);
  })).then(function (fields) {
    return _.reduce(fields, appendElementClones, newForm());
  });
}

/**
 * create a promise that returns the created fields
 * @param {object} data
 * @param {object} data._schema
 * @returns {Promise}
 */
function createFormPromise(data) {
  var field = _.get(data, '_schema.' + references.fieldProperty);

  // iterate through the data, creating fields
  if (field) {
    // this is a single field
    return createField(data);
  } else {
    // this is a group of fields
    return expandFields(data);
  }
}

/**
 * init rivets and bind to the form
 * @param {object} form
 */
function bindForm(form) {
  // instantiate data-binding
  _.assign(rivets.binders, form.binders);
  _.assign(rivets.formatters, form.formatters);
  currentBindings = rivets.bind(form.el, form.bindings);
}

/**
 * @param {string} ref  Place we'll be saving to
 * @param {object} data  The data itself (starting from path)
 * @param {Element} [rootEl=document.body]   Root element to temporarily insert the overlay
 * @returns {Promise}
 */
function createForm(ref, data, rootEl) {
  var schema, name, el;

  ensureValidFormData(ref, data);
  rootEl = rootEl || document.body;
  schema = data._schema;
  name = schema._name; // we're already checking to make sure these exist

  return createFormPromise(data).then(function (form) {
    bindForm(form);

    // build up form el
    el = createOverlayEl(createOverlayFormEl(label(name, schema), form.el));
    // append it to the body
    rootEl.appendChild(el);

    // register + instantiate controllers
    ds.controller('form', require('../controllers/form'));
    ds.controller('overlay', require('../controllers/overlay'));
    ds.get('form', el, ref, name);
    ds.get('overlay', el);

    return el;
  });
}

/**
 * @param {string} ref  Place we'll be saving to
 * @param {object} data  The data itself (starting from path)
 * @param {Element} oldEl   Root element that is being inline edited
 * @returns {Promise}
 */
function createInlineForm(ref, data, oldEl) {
  var schema, name, newEl, wrapped;

  ensureValidFormData(ref, data);
  schema = data._schema;
  name = schema._name;

  return createFormPromise(data).then(function (form) {
    bindForm(form);

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

    return newEl;
  });
}

/**
 * get current bindings
 * used in form-values to get values from the form
 * @returns {object} currentBindings
 */
function getBindings() {
  return currentBindings;
}

/**
 * clear current bindings
 */
function clearBindings() {
  currentBindings = {};
}

module.exports = {
  createForm: createForm,
  createInlineForm: createInlineForm,
  getBindings: getBindings,
  clearBindings: clearBindings
};
