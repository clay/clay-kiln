const select = require('./components/select'),
  focus = require('../decorators/focus'),
  forms = require('./forms'),
  dom = require('@nymag/dom'),
  references = require('./references'),
  _ = require('lodash'),
  hashSeperator = '::';

/**
 * get group that a field is inside, or return undefined
 * @param {string} field
 * @param {object} data
 * @returns {string|undefined}
 */
function getGroupFromField(field, data) {
  const groups = _.get(data, '_schema._groups');

  if (groups) {
    return _.findKey(groups, function (val) {
      return _.includes(val.fields, field);
    });
  } // otherwise return undefined
}

/**
 * get settings group if the field has _display: settings, or return undefined
 * @param {string} field
 * @param {object} [data]
 * @returns {string|undefined}
 */
function getSettingsFromField(field, data) {
  if (_.get(data, `${field}._schema._display`) === 'settings') {
    return field;
  }
}

/**
 * validation errors give us the component ref and field,
 * but we need to figure out what form to open based on the field.
 * note: if a field is in multiple groups/forms, it'll get the first one
 * @param  {string} field
 * @param  {object} data
 * @return {string|undefined}
 */
function getPathFromField(field, data) {
  // if it's in a group, return the group name
  // else if it has _display: settings, return settings
  // else return the field name itself
  return getGroupFromField(field, data) || getSettingsFromField(field, data) || field;
}

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
 * note: pass in a ref and path, or it'll get them from the hash
 * @param {string} [ref]
 * @param {string} [path]
 * @param {Event} [e]
 * @returns {Promise|undefined}
 */
function navigate(ref, path, e) {
  const options = ref && path ? {ref, path} : fromHash(window.location.hash),
    field = findField(options),
    component = findComponent(options.ref);

  // open form
  if (field) {
    return focus.focus(field, options, e);
  } else {
    // select the component
    select.select(component);
    return forms.open(options.ref);
  }
}

module.exports.set = set;
module.exports.unset = unset;
module.exports.navigate = navigate;
module.exports.getPathFromField = getPathFromField;
