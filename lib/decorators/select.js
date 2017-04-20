import Vue from 'vue';
import _ from 'lodash';
import delegate from 'delegate';
import store from '../core-data/store';
import { prependChild } from '@nymag/dom';
import { refAttr, layoutAttr, refProp, componentListProp, componentProp, getComponentName } from '../utils/references';
import { getComponentEl, getParentComponent } from '../utils/component-elements';
import { getData, getSchema } from '../core-data/components';
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
    const schema = getSchema(parent);

    if (_.has(schema, `${path}.${componentListProp}`)) {
      return { path, type: 'list' };
    } else if (_.has(schema, `${path}.${componentProp}`)) {
      return { path, type: 'prop' };
    } else {
      console.warn(`${getComponentName(parent)} has no field for ${path} in its schema, but has ${getComponentName(child)} in its data`);
      return { path };
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
  const parent = getParentComponent(el),
    parentURI = parent && (parent.getAttribute(layoutAttr) || parent.getAttribute(refAttr)),
    parentField = parentURI && getParentField(uri, parentURI);

  let selector = new Selector({ uri, parentURI, parentField }).$mount();

  // make sure components are relatively positioned
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
