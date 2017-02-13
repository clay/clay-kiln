import Vue from 'vue';
import store from '../core-data/store';
import { prependChild } from '@nymag/dom';
import { refAttr } from '../utils/references';
import { getParentComponent } from '../utils/component-elements';
import selectorTpl from './selector.vue';

const Selector = Vue.component('selector', selectorTpl);

/**
 * handle clicks on the component itself
 * @param {Element} el
 * @param {MouseEvent} e
 */
function componentClickHandler(el, e) {
  // allow events to propagate upwards, but set a flag
  // this allows forms to fire the "outsideClickhandler" to close themselves
  // while preventing parent components from thinking they're being selected
  if (!e.stopSelection) {
    e.stopSelection = true;

    if (!el.classList.contains('selected')) {
      // note: don't unfocus before selecting another component
      // this prevents it from trying to save twice, though users may get into a state
      // where one component's form is open when another component is selected
      store.dispatch('select', el);
    }
  }
}

/**
 * add selector to element
 * @param {string} uri
 * @param {element} el  root element of component
 */
export function addSelector(uri, el) {
  const parent = getParentComponent(el),
    parentURI = parent && parent.getAttribute(refAttr);

  let selector = new Selector({ uri, parentURI }).$mount();

  // make sure components are relatively positioned
  el.classList.add('component-selector-wrapper');
  el.addEventListener('click', componentClickHandler.bind(null, el));

  // add selector to the component el, BEHIND the component's children
  prependChild(el, selector.$el);
}
