import _ from 'lodash';
import { get } from '../core-data/groups';
import { displayProp } from '../utils/references';
import { create, destroy } from './inline-form';
import { OPEN_FORM, CLOSE_FORM } from './mutationTypes';
import { UPDATE_HASH, CLEAR_HASH } from '../deep-linking/mutationTypes';

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

export function openForm(store, { uri, path, el, offset, appendText }) {
  const group = get(uri, path),
    display = _.get(group, `schema.${displayProp}`) || 'overlay'; // defaults to overlay if not specified

  // send the data to state.ui.currentForm!
  // this is needed for inline forms to render,
  // and will AUTOMAGICALLY make overlay/settings forms appear
  store.commit(OPEN_FORM, { uri, path, fields: _.cloneDeep(group.fields), schema: group.schema, el, initialOffset: offset, appendText });

  // Update the hash of the page so we can directly open this form on page load
  store.commit(UPDATE_HASH, { uri, path });

  if (display === 'inline') {
    // create an inline form, and keep the vm created in memory
    inline = create(uri, path, el);
  }
}

export function closeForm(store) {
  const currentForm = _.get(store, 'state.ui.currentForm', null);
  var isInlineForm, formData, group;

  if (!currentForm) {
    return Promise.resolve();
  }

  isInlineForm = _.get(currentForm, `schema.${displayProp}`, '') === 'inline';
  formData = currentForm.fields;
  group = get(currentForm.uri, currentForm.path);

  let promise;

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
    store.commit(CLEAR_HASH); // Update page url hash
  });
}
