
/**
 * Mounts a Vue instance on an HTMLElement.
 * @class
 * @param {HTMLElement} el
 * @param {Schema} [schema={}]
 * @param {string} [uri='']
 */

function Editable(el, schema = {}, uri = '') {

  // -- Interface

  // mounts the Vue instance
  function mount() { }

  return {
    mount,
    schema,
    el,
    uri,
  };
}




// -- Definitions

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
