import { editAttr, componentListProp, componentProp } from '../utils/references';
import { get } from '../core-data/groups';
import store from '../core-data/store';

/**
 * determine if a data-editable attribute can open a form
 * e.g. if it points to a field or group (not a component list or prop)
 * @param  {string}  uri
 * @param  {string}  path
 * @return {Boolean}
 */
function isFocusable(uri, path) {
  const group = get(uri, path);

  return !group.schema[componentListProp] && !group.schema[componentProp];
}

/**
 * add focus click handler
 * @param {string} uri
 * @param {string} path
 * @param {Element} el
 */
function addFocusHandler(uri, path, el) {
  // note: don't stop propagation when focusing,
  // since we want to also select whatever component we clicked into
  // but, like stopSelection, we don't want to unfocus when the event propagates
  // up to the document
  el.addEventListener('click', (e) => {
    if (!e.stopFocus) {
      e.stopFocus = true;

      store.dispatch('focus', { uri, path, el });
    }
  });
}

/**
 * add handler to focus on fields or groups, if applicable
 * @param  {string} uri
 * @param  {Element} el
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr);

  if (isFocusable(uri, path)) {
    addFocusHandler(uri, path, el);
  }
}
