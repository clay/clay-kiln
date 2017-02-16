import _ from 'lodash';
import Vue from 'vue';
import { wrapElements, find, unwrapElements, removeElement } from '@nymag/dom';
import { selectorClass, wrappedClass, inlineFormClass } from '../utils/references';
import inlineTpl from './inline.vue';

const InlineForm = Vue.component('inline-form', inlineTpl);

/**
 * filter out component selector
 * @param  {Element} node
 * @return {boolean}
 */
function filterOutSelector(node) {
  if (node.nodeType === 1) {
    return !node.classList.contains(selectorClass);
  } else {
    return true; // always pass through text nodes
  }
}

export function create(uri, path, el) {
  const wrapped = wrapElements(_.filter(el.childNodes, filterOutSelector), 'span'),
    inlineForm = new InlineForm({ uri, path }).$mount();

  wrapped.classList.add(wrappedClass);
  el.appendChild(wrapped);
  el.appendChild(inlineForm.$el);
  return inlineForm;
}

export function destroy(vm, currentForm) {
  const el = currentForm.el,
    formEl = find(el, `.${inlineFormClass}`),
    wrapped = find(el, `.${wrappedClass}`);

  vm.$destroy(); // destroy the inline form vue component before removing it from the dom
  unwrapElements(el, wrapped);
  removeElement(formEl);
}
