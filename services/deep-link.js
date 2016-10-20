const focus = require('../decorators/focus'),
  select = require('./components/select'),
  forms = require('./forms'),
  dom = require('@nymag/dom'),
  references = require('./references'),
  hashSeperator = '::';

/**
 * find component element on the page
 * @param {string} ref
 * @returns {Element|null}
 */
function findComponent(ref) {
  return dom.find(`[${references.referenceAttribute}="${ref}"]`);
}

/**
 * find field element on the page
 * note: this works for components with fields inside them AND components
 * where data-editable is set on the component element itself
 * @param {object} options
 * @param {string} options.ref
 * @param {string} options.path
 * @returns {Element|null}
 */
function findField(options) {
  const componentEl = findComponent(options.ref);

  if (componentEl.getAttribute(references.editableAttribute) === options.path) {
    return componentEl;
  } else {
    return dom.find(componentEl, `[${references.editableAttribute}="${options.path}"]`);
  }
}

/**
 * generate a hash from a ref and path
 * note: we use double colons because the ref might have a port specified
 * todo: if we want to expand this to deep link to places other than forms,
 * we could do `type::ref::path`, e.g.
 * `form::domain.com/components/foo/instances/bar::settings` or
 * `select::domain.com/components/foo/instances/bar` or
 * `pane::publish`
 * @param {string} ref
 * @param {string} path
 * @returns {string} base64 encoded ref::path
 */
function toHash(ref, path) {
  return '#' + window.btoa(`${ref}${hashSeperator}${path}`);
}

/**
 * parse ref and path from hash
 * @param {string} hash
 * @returns {object}
 */
function fromHash(hash) {
  const unencoded = window.atob(hash.replace('#', '')),
    ref = unencoded.split(hashSeperator)[0],
    path = unencoded.split(hashSeperator)[1];

  return {ref, path};
}

/**
 * set the hash (when opening forms)
 * @param {string} ref
 * @param {string} path
 */
function set(ref, path) {
  path = path || 'settings';
  window.location.hash = toHash(ref, path);
}

/**
 * unset the hash (when closing forms)
 */
function unset() {
  window.location.hash = '';
}

/**
 * navigate to a form based on the hash
 * @param {string} [hash]
 * @returns {Promise|undefined}
 */
function navigate() {
  const options = fromHash(window.location.hash),
    field = findField(options),
    component = findComponent(options.ref);

  if (field) {
    return focus.focus(field, options);
  } else if (component) {
    select.select(component);
    return forms.open(options.ref);
  }
}

module.exports.set = set;
module.exports.unset = unset;
module.exports.navigate = navigate;
