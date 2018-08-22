
/**
 * Mounts a Vue instance on an HTMLElement.
 * @class Editable
 * @param {HTMLElement} el
 * @param {Schema} [schema={}]
 * @param {string} [uri='']
 * @return {Editable}
 */

function Editable(el, schema = {}, uri = '') {

  // -- Interface

  // mounts the Vue instance
  function mount() { }


  // -- Internals
  function validate() { }

  return {
    mount,
    schema,
    el,
    uri,
  };
}

/**
 * Constructor for a placeholder
 * @class EditablePlaceholder~Editable
 * @param {HTMLElement} el
 * @param {Schema} schema
 * @param {string} uri
 */
function EditablePlaceholder(el, schema = {}, uri = '') {

  const editable = Editable(...arguments);

  return {
    mount: editable.mount,
    schema,
    el,
    uri,
  };
}

/**
 * Constructor for a placeholder
 * @class EditableSelector~Editable
 * @param {HTMLElement} el
 * @param {Schema} schema
 * @param {string} uri
 */
function EditableSelector(el, schema = {}, uri = '') {

  const editable = Editable(...arguments);

  return {
    mount: editable.mount,
    schema,
    el,
    uri,
  };
}

/**
 * Constructor for a placeholder
 * @class EditableGroup~Editable
 * @param {HTMLElement} el
 * @param {Schema} schema
 * @param {string} uri
 */
function EditableGroup(el, schema = {}, uri = '') {

  const editable = Editable(...arguments);

  return {
    /**
     * Returns Array of Editables
     * @return {Editable}
     */
    get items() { return []; },
    mount: editable.mount,
    schema,
    el,
    uri,
  };
}


// -- Definitions

/**
 * Editable
 * @typedef {object} Schema
 * @property {FieldConfig} _has
 * @property {string} _label
 * @property {Placeholder} _placeholder
 */

/**
 * Input from clay component including validations and other directives for Kiln (Observable)
 * @typedef {object} Schema
 * @property {FieldConfig} _has
 * @property {string} _label
 * @property {Placeholder} _placeholder
 */

/**
 * TODO
 * Defines Hotspot with label for adding compoents to (Observable)
 * @typedef {Object} Placeholder
 */

/**
 * Defines Hotspot with label for adding compoents to (Observable)
 * @typedef {object} FieldConfig
 * @property {string} help help text
 * @property {string|number} input  TODO: verify
 * @property {array.FieldConfig} props TODO: verify
 * @property {Validation} validate
 */

/**
 * Defines rules for validating a field (Observable)
 * @typedef {object} Validation
 * @property {number} min
 * @property {number} max
 * @property {string} minMessage
 * @property {boolean} required
 */

/**
 * TODO
 * Defines an input
 * @typedef {object} Prop
 * @property {string}
 */

/**
 * TODO
 * @typedef {object} Sections
 * @property {string}
 */

export default Editable;
