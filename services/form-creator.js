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
 * create fields recursively
 * @param  {{path: string, display: string, data: object}} context
 * @return {Element | undefined}
 */
function createField(context) {
  var schema = context.data._schema,
    el, finalEl;

  if (schema[references.fieldProperty]) {
    return behaviors.run(context);
  }

  // iterate through this level of the schema, creating more fields
  el = expandFields(context); // eslint-disable-line

  // once we're done iterating, put those in a section
  finalEl = dom.create(`
    <section class="editor-section">
      <h2 class="editor-section-head">${label(context.path, schema)}</h2>
      <div class="editor-section-body">
    </section>
  `);
  dom.find(finalEl, '.editor-section-body').appendChild(el);

  return finalEl;
}

/**
 * Iterate through this level of the schema, creating more fields
 *
 * @param {object} data
 * @returns {Element}
 */
function expandFields(data) {
  return _(data)
    .omit(isMetadata)
    .pick(_.isObject)
    .map(function (value, name) {
      console.log(value, name)
      var path = context.path ? context.path + '.' + name : name;

      if (data[name]) {
        return createField({data: data[name], path: path});
      } else {
        return null; // only create fields if they exist in the data. this is used to filter the settings form
      }
    })
    .compact() // remove nulls
    .reduce(appendElementClones, document.createDocumentFragment());
}

/**
 * @param {string} ref  Place we'll be saving to
 * @param {object} data  The data itself (starting from path)
 * @param {Element} [rootEl=document.body]   Root element to temporarily insert the overlay
 */
function createForm(ref, data, rootEl) {
  var el;

  ensureValidFormData(ref, data);
  rootEl = rootEl || document.body;

  // iterate through the data, creating fields
  el = expandFields(data);

  // build up form el
  el = createOverlayEl(createOverlayFormEl(label(data._schema._name, data._schema), el));
  // append it to the body
  rootEl.appendChild(el);

  // register + instantiate controllers
  ds.controller('form', require('../controllers/form'));
  ds.controller('overlay', require('../controllers/overlay'));
  ds.get('form', el, ref, data._schema._name);
  ds.get('overlay', el);
}

/**
 * @param {string} ref  Place we'll be saving to
 * @param {string} path  What path within the data is being shown/modified
 * @param {object} data  The data itself (starting from path)
 * @param {Element} oldEl   Root element that is being inline edited
 */
function createInlineForm(ref, path, data, oldEl) {
  var innerEl, schema, newEl, isField, context, wrapped;

  ensureValidFormData(ref, path, data);

  schema = data._schema;
  isField = !!schema[references.fieldProperty];
  context = {
    data: data,
    path: path,
    display: 'inline'
  };

  if (isField) {
    innerEl = createField(context);
  } else {
    innerEl = expandFields(context);
  }

  // build up form el
  newEl = createInlineFormEl(innerEl);
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
  ds.get('form', newEl, ref, path, oldEl);
}

module.exports = {
  createForm: createForm,
  createInlineForm: createInlineForm
};
