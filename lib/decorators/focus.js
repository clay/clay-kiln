import _ from 'lodash';
import delegate from 'delegate';
import { refAttr, layoutAttr, editAttr, componentListProp, componentProp } from '../utils/references';
import { getClickOffset } from '../utils/caret';
import { get } from '../core-data/groups';
import store from '../core-data/store';
import { fieldSelectors, getFieldEl, getComponentEl, isComponentInPage } from '../utils/component-elements';
import { getEventPath } from '../utils/events';

const delegated = {};

/**
 * determine if a data-editable attribute can open a form
 * e.g. if it points to a field or group (not a component list or prop)
 * @param  {string}  uri
 * @param  {string}  path
 * @return {Boolean}
 */
function isFocusable(uri, path) {
  const group = get(uri, path);

  return group ? !group.schema[componentListProp] && !group.schema[componentProp] : false;
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
  const fieldEl = getFieldEl(uri, path),
    isPageEditMode = _.get(store, 'state.editMode') === 'page',
    isPageComponent = isComponentInPage(uri),
    isActive = isPageEditMode && isPageComponent || !isPageEditMode && !isPageComponent;

  // you can only click to edit components that are active,
  // e.g. page-specific components when in page edit mode,
  // layout-specific components when in layout edit mode
  if (isActive && fieldEl === e.delegateTarget) {
    const pos = { x: e.clientX, y: e.clientY };

    store.dispatch('focus', { uri, path, el: fieldEl, offset: getClickOffset(e), pos });
  }
}

/**
 * add focus click handler
 * @param {string} uri
 * @param {string} path
 */
function addFocusHandler(uri, path) {
  const selectors = fieldSelectors(uri, path);

  let stored = _.get(delegated, `${uri}[${path}]`);

  if (stored) {
    // destroy delegated handlers before adding new ones (e.g. when re-rendering)
    _.forEach(stored, (handler) => handler.destroy());
  }

  // note: don't stop propagation when focusing,
  // since we want to also select whatever component we clicked into
  // but, like stopSelection, we don't want to unfocus when the event propagates
  // up to the document
  stored = [];
  stored.push(delegate(document.body, selectors[0], 'click', onFocus.bind(null, uri, path)));
  stored.push(delegate(document.body, selectors[1], 'click', onFocus.bind(null, uri, path)));
  _.set(delegated, `${uri}[${path}]`, stored);
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

/**
 * determine if a user has clicked into a focusable element
 * @param  {MouseEvent}  e
 * @return {Boolean}
 */
export function hasClickedFocusableEl(e) {
  const fieldEl = _.find(getEventPath(e), (node) => node.nodeType && node.nodeType === node.ELEMENT_NODE && node.hasAttribute(editAttr)),
    componentEl = fieldEl && getComponentEl(fieldEl),
    uri =  componentEl && (componentEl.getAttribute(layoutAttr) || componentEl.getAttribute(refAttr)),
    path = fieldEl && fieldEl.getAttribute(editAttr);

  if (uri && path) {
    return isFocusable(uri, path);
  } else {
    return false;
  }
}
