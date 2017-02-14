import Vue from 'vue';
import _ from 'lodash';
import store from '../core-data/store';
import { prependChild } from '@nymag/dom';
import { refAttr, refProp, componentListProp, componentProp, getComponentName } from '../utils/references';
import { getParentComponent } from '../utils/component-elements';
import { getData, getSchema } from '../core-data/components';
import selectorTpl from './selector.vue';

const Selector = Vue.component('selector', selectorTpl);

/**
 * handle clicks on the component itself
 * @param {Element} el
 * @param {MouseEvent} e
 */
function componentClickHandler(el, e) {
  // don't bubble the event up when clicking components.
  // this prevents the document click handler from unselecting when we're trying to select stuff,
  // but attaching it to the root element of a component allows us to click into forms
  e.stopPropagation();

  if (!el.classList.contains('selected')) {
    // note: don't unfocus before selecting another component
    // this prevents it from trying to save twice, though users may get into a state
    // where one component's form is open when another component is selected
    store.dispatch('select', el);
  }
}

/**
 * get parent field (and type of field) that child component lives in
 * note: this sends warnings to the console if it's missing schema stuff
 * @param  {string} child  uri
 * @param  {string} parent uri
 * @return {object}
 */
function getParentField(child, parent) {
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
    parentURI = parent && parent.getAttribute(refAttr),
    parentField = parentURI && getParentField(uri, parentURI);

  let selector = new Selector({ uri, parentURI, parentField }).$mount();

  // make sure components are relatively positioned
  el.classList.add('component-selector-wrapper');
  el.addEventListener('click', componentClickHandler.bind(null, el));

  // add selector to the component el, BEHIND the component's children
  prependChild(el, selector.$el);
}
