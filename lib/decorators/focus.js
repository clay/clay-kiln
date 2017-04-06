import delegate from 'delegate';
import { editAttr, componentListProp, componentProp } from '../utils/references';
import { getClickOffset } from '../utils/caret';
import { get } from '../core-data/groups';
import store from '../core-data/store';
import { fieldSelectors, getFieldEl } from '../utils/component-elements';

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
 * focus on a field
 * note: grabs the path from the dom again, in case the element has been changed
 * since the handler was first added
 * @param  {string} uri
 * @param  {string} path
 * @param  {Event} e
 */
function onFocus(uri, path, e) {
  if (!e.stopFocus) {
    e.stopFocus = true;
    store.dispatch('focus', { uri, path, el: getFieldEl(uri, path), offset: getClickOffset(e) });
  }
}

/**
 * add focus click handler
 * @param {string} uri
 * @param {string} path
 */
function addFocusHandler(uri, path) {
  const selectors = fieldSelectors(uri, path);

  // note: don't stop propagation when focusing,
  // since we want to also select whatever component we clicked into
  // but, like stopSelection, we don't want to unfocus when the event propagates
  // up to the document
  delegate(document.body, selectors[0], 'click', onFocus.bind(null, uri, path));
  delegate(document.body, selectors[1], 'click', onFocus.bind(null, uri, path));
}

/**
 * add handler to focus on fields or groups, if applicable
 * @param  {string} uri
 * @param  {Element} el
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr);

  if (isFocusable(uri, path)) {
    addFocusHandler(uri, path);
  }
}
