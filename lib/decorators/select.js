import Vue from 'vue';
import _ from 'lodash';
import delegate from 'delegate';
import store from '../core-data/store';
import { prependChild } from '@nymag/dom';
import { refAttr, editAttr, refProp, componentListProp, componentProp, getComponentName } from '../utils/references';
import { getComponentEl, getFieldEl } from '../utils/component-elements';
import { getData, getSchema } from '../core-data/components';
import { getEventPath } from '../utils/events';
import selectorTpl from './selector.vue';

const Selector = Vue.component('selector', selectorTpl),
  delegated = {};

/**
 * handle clicks on the component itself
 * @param {string} uri
 * @param {MouseEvent} e
 */
function componentClickHandler(uri, e) {
  const targetComponent = getComponentEl(e.target);

  // allow events to propagate upwards, but set a flag
  // this allows the document event listener to catch the events and unfocus forms,
  // but prevents the same document event listener from unselecting the current component
  // when the event propagates up to it
  if (!e.stopSelection && targetComponent === e.delegateTarget) {
    e.stopSelection = true;

    if (!targetComponent.classList.contains('selected')) {
      // note: we don't unfocus before selecting another component,
      // since that would cause double-saving in certain scenarios
      // (legacy components that need to send data to the server before re-rendering)
      store.dispatch('select', targetComponent);
    }
  }
}

/**
 * get parent field (and type of field) that child component lives in
 * note: this sends warnings to the console if it's missing schema stuff
 * @param  {string} child  uri
 * @param  {string} parent uri
 * @return {object}
 */
export function getParentField(child, parent) {
  const parentData = getData(parent),
    path = _.findKey(parentData, (prop) => {
      if (_.isArray(prop)) {
        return _.find(prop, (item) => item[refProp] === child);
      } else if (_.isObject(prop)) {
        return prop[refProp] === child;
      }
    });

  if (path) {
    const schema = getSchema(parent),
      el = getFieldEl(parent, path),
      isFieldEditable = !!el && el.hasAttribute(editAttr);

    if (_.has(schema, `${path}.${componentListProp}`)) {
      return { path, type: 'list', isEditable: isFieldEditable };
    } else if (_.has(schema, `${path}.${componentProp}`)) {
      return { path, type: 'prop', isEditable: isFieldEditable };
    } else {
      console.warn(`${getComponentName(parent)} has no field for ${path} in its schema, but has ${getComponentName(child)} in its data`);
      // note: the selector buttons that rely on isEditable will not display (since there's no type),
      // but this will expose more information for developers to troubleshoot their schemae
      return { path, isEditable: isFieldEditable };
    }
  } else {
    return {};
  }
}

/**
 * add selector to element
 * @param {string} uri
 * @param {element} el  root element of component
 */
export function addSelector(uri, el) {
  let selector = new Selector({ componentEl: el }).$mount();

  // // make sure components are relatively positioned
  el.classList.add('component-selector-wrapper');

  if (parent) {
    if (delegated[uri]) {
      delegated[uri].destroy(); // destroy delegated handlers before adding new ones (e.g. when re-rendering)
    }

    delegated[uri] = delegate(document.body, `[${refAttr}="${uri}"]`, 'click', componentClickHandler.bind(null, uri), false);

    // add selector to the component el, BEHIND the component's children
    prependChild(el, selector.$el);
  }
}

/**
 * determine if a user has clicked into a focusable element
 * @param  {MouseEvent}  e
 * @return {Boolean}
 */
export function hasClickedSelectableEl(e) {
  return !!_.find(getEventPath(e), (node) => node.nodeType && node.nodeType === node.ELEMENT_NODE && node.hasAttribute(refAttr));
}
