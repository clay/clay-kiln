import { get } from 'lodash';
import Vue from 'vue';
import { prependChild } from '@nymag/dom';
import store from '../core-data/store';
import { SELECT, UN_SELECT } from './mutationTypes';
import selectorTpl from './selector.vue';

const Selector = Vue.component('selector', selectorTpl),
  selectorHeight = 56; // selector menus are 48px tall, offset is 8px

/**
 * remove top/bottom padding from body
 */
function removePadding() {
  document.body.style['padding-top'] = '0px';
  document.body.style['padding-bottom'] = '0px';
}

/**
 * unselect currently-selected component
 */
export function unselect() {
  const current = get(store, 'state.ui.currentSelected');

  if (current) {
    current.classList.remove('kiln-suppress-animation'); // unsuppress initialFadeInOut animation
    current.classList.remove('selected');
    removePadding();
  }

  store.commit(UN_SELECT);
}

/**
 * get the top and bottom offset of an element
 * @param {Element} el
 * @returns {object}
 */
function getOffset(el) {
  var rect = el.getBoundingClientRect(),
    body = document.body,
    doc = document.documentElement,
    bodyHeight = body.getBoundingClientRect().height,
    scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop,
    clientTop = doc.clientTop || body.clientTop || 0,
    top  = rect.top +  scrollTop - clientTop,
    bottom =  bodyHeight - (rect.bottom + scrollTop - clientTop);

  return { top: Math.round(top), bottom: Math.round(bottom) };
}

/**
 * add padding to top/bottom of document to account for selector menu overflow
 * note: this assumes document.body has NO padding normally
 * @param {Element} el that was selected
 */
function addPadding(el) {
  var offset = getOffset(el);

  // check top overflow
  if (offset.top < selectorHeight) {
    document.body.style['padding-top'] = `${selectorHeight - offset.top}px`;
  }

  if (offset.bottom < selectorHeight) {
    document.body.style['padding-bottom'] = `${selectorHeight - offset.bottom}px`;
  }
}

/**
 * select a component
 * @param  {element} el
 */
export function select(el) {
  // only one component can be selected at a time
  unselect();

  // if we're clicking into element directly, don't run the initialFadeInOut animation
  // note: we're adding an otherwise-unused css rule on :hover, which we check
  // when selecting to see if the mouse/pointer is currently hovering over the element
  if (getComputedStyle(el).getPropertyValue('backface-visibility') === 'hidden') {
    el.classList.add('kiln-suppress-animation');
  }

  // selected component gets .selected
  if (el.tagName !== 'HTML') {
    el.classList.add('selected');
    addPadding(el);
    store.commit(SELECT, el);
  }

}

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
      select(el);
    }
  }
}

/**
 * add selector to element
 * @param {string} uri
 * @param {element} el  root element of component
 */
export function addSelector(uri, el) {
  let selector = new Selector({ uri: uri }).$mount();

  // make sure components are relatively positioned
  el.classList.add('component-selector-wrapper');
  el.addEventListener('click', componentClickHandler.bind(null, el));

  // add selector to the component el, BEHIND the component's children
  prependChild(el, selector.$el);
}
