import _ from 'lodash';
import { get } from '../core-data/groups';
import { fieldProp, inputProp } from '../utils/references';
import { create, destroy } from './inline-form';
import { OPEN_FORM, CLOSE_FORM, UPDATE_FORMDATA } from './mutationTypes';

/**
 * @module forms
 */

// inline form is stored in memory here, rather than in the store
// this prevents vuex from trying to bind stuff to it and recursing infinitely
let inline = null;

/**
 * determine if data in form has changed
 * note: convert data to plain objects, since they're reactive
 * @param  {object}  newData from form
 * @param  {object}  oldData from store
 * @return {Boolean}
 */
function hasDataChanged(newData, oldData) {
  return !_.isEqual(_.toPlainObject(newData), _.toPlainObject(oldData));
}

/**
 * Update form data
 * @param {object} store
 * @param {string} path
 * @param {string|number} val
 */
export function updateFormData(store, { path, val }) {
  if (_.isString(val)) {
    // remove 'line separator' and 'paragraph separator' characters from text inputs
    // (not visible in text editors, but get added when pasting from pdfs and old systems)
    val = val.replace(/(\u2028|\u2029)/g, '');
  }

  store.commit(UPDATE_FORMDATA, { path, data: val });
}

/**
 * open form
 * @param  {object} store
 * @param  {string} uri        component uri
 * @param  {string} path       field/form path
 * @param  {Element} [el]         parent element (for inline forms)
 * @param  {number} [offset]     caret offset (for text inputs)
 * @param  {string} [appendText] text to append (for text inputs, used when splitting/merging components with text fields)
 * @param  {string} [initialFocus] if focusing on a specific field when opening the form
 * @param  {object} pos        x/y coordinates used to position overlay forms
 */
export function openForm(store, { uri, path, el, offset, appendText, pos, initialFocus }) {
  const group = get(uri, path),
    // take into account shorthand input definition, e.g. `_has: inline`, as well as regular input definition
    isInlineWYSIWYG = _.get(group, `schema.${fieldProp}`) === 'inline' || _.get(group, `schema.${fieldProp}.${inputProp}`) === 'inline';

  // send the data to state.ui.currentForm!
  // this is needed for inline forms to render,
  // and will AUTOMAGICALLY make overlay/settings forms appear
  store.commit(OPEN_FORM, { uri, path, inline: isInlineWYSIWYG, initialFocus, fields: _.cloneDeep(group.fields), schema: group.schema, initialOffset: offset, appendText, pos });

  // Update the hash of the page so we can directly open this form on page load
  store.dispatch('setHash', { uri, path, initialFocus });

  if (isInlineWYSIWYG) {
    // create an inline form, and keep the vm created in memory
    inline = create(uri, path, el);
  }
}

/**
 * Close a form
 * @param {object} store
 * @returns {promise}
 */
export function closeForm(store) {
  const currentForm = _.get(store, 'state.ui.currentForm', null);

  let isInlineForm, formData, group, promise;

  if (!currentForm) {
    return Promise.resolve();
  }

  isInlineForm = currentForm.inline;
  formData = currentForm.fields;
  group = get(currentForm.uri, currentForm.path);

  if (hasDataChanged(formData, group.fields)) {
    promise = store.dispatch('saveComponent', { uri: currentForm.uri, data: formData });
  } else {
    promise = Promise.resolve();
  }

  return promise.then(() => {
    // overlay/settings forms get closed automatically, but inline forms must be unwrapped
    if (isInlineForm) {
      destroy(inline, currentForm);
      // once inline form is destroyed, remove it from memory
      inline = null;
    }

    store.commit(CLOSE_FORM);
    store.dispatch('clearHash'); // Update page url hash
  });
}
