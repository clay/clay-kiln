import Vue from 'vue';
import _ from 'lodash';
import delegate from 'delegate';
import store from '../core-data/store';
import { prependChild, closest } from '@nymag/dom';
import { refAttr, layoutAttr, editAttr, refProp, componentListProp, componentProp, getComponentName, isComponent } from '../utils/references';
import { getComponentEl, getFieldEl, getParentComponent } from '../utils/component-elements';
import { getData, getSchema } from '../core-data/components';
import { getEventPath } from '../utils/events';
import logger from '../utils/log';

const log = logger(__filename),
  delegated = {},
  selectors = {};

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
  if (!e.stopSelection && uri === targetComponent.getAttribute(refAttr)) {
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
      isFieldEditable = !!el ? el.hasAttribute(editAttr) : null; // if field el isn't found, this will be null instead of false

    if (_.has(schema, `${path}.${componentListProp}`)) {
      return { path, type: 'list', isEditable: isFieldEditable };
    } else if (_.has(schema, `${path}.${componentProp}`)) {
      return { path, type: 'prop', isEditable: isFieldEditable };
    } else {
      log.debug(`${getComponentName(parent)} has no field for ${path} in its schema, but has ${getComponentName(child)} in its data`, { action: 'getParentField' });
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
  const selectorTpl = require('./selector.vue'),
    Selector = Vue.component('selector', selectorTpl),
    parent = getParentComponent(el),
    parentURI = parent && (parent.getAttribute(layoutAttr) || parent.getAttribute(refAttr)),
    parentField = parentURI && getParentField(uri, parentURI);

  // note: `el` is a reserved property when instantiating vue components, so we use `componentEl`
  let selector = new Selector({ store, uri, componentEl: el, parentField, parentURI }).$mount();

  // make sure components are relatively positioned
  el.classList.add('component-selector-wrapper');

  if (delegated[uri]) {
    // destroy delegated handlers before adding new ones (e.g. when re-rendering)
    delegated[uri].destroy();
  }

  delegated[uri] = delegate(document.body, `[${refAttr}="${uri}"]`, 'click', componentClickHandler.bind(null, uri), false);

  // add global mouseover handler if it hasn't been added yet
  if (!delegated.bodyMouseover) {
    delegated.bodyMouseover = true;
    document.body.addEventListener('mouseover', _.debounce((e) => {
      const closestComponent = closest(e.target, `[${refAttr}]`);

      if (closestComponent &&
          isComponent(closestComponent.getAttribute(refAttr)) && // if hovering over a component
          getComponentName(closestComponent.getAttribute(refAttr)) !== 'clay-kiln' && // and that component isn't kiln
          !_.get(store, 'state.ui.currentForm') && // and there are no forms open
          !closestComponent.classList.contains('selected')) { // and the hovered component isn't selected
        store.dispatch('select', closestComponent); // ...select it!
      } else if (closestComponent &&
          !isComponent(closestComponent.getAttribute(refAttr)) && // if hovering over something that isn't a component
          !_.get(store, 'state.ui.currentForm')) { // and there are no forms open
        // unselect if mousing back over the page
        store.dispatch('unselect');
      }
    }, 100));
  }

  // add selector to the component el, BEHIND the component's children
  prependChild(el, selector.$el);
  // add the selector to a global object, so we can properly destroy it when re-rendering
  selectors[uri] = selector;
}

/**
 * destroy selectors when re-rendering components
 * @param  {string} uri
 */
export function destroySelector(uri) {
  if (selectors[uri]) {
    selectors[uri].$destroy();
    selectors[uri] = null;
  }
}

/**
 * determine if a user has clicked into a focusable element
 * @param  {MouseEvent}  e
 * @return {Boolean}
 */
export function hasClickedSelectableEl(e) {
  return !!_.find(getEventPath(e), (node) => node.nodeType &&
    node.nodeType === node.ELEMENT_NODE &&
    node.hasAttribute(refAttr) &&
    !node.hasAttribute(layoutAttr) &&
    getComponentName(node.getAttribute(refAttr)) !== 'clay-kiln');
}
