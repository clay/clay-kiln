import _ from 'lodash';
import Vue from 'vue';
import { wrapElements } from '@nymag/dom';
import { selectorClass, wrappedClass } from '../utils/references';
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

export function inline(uri, path, el) {
  const wrapped = wrapElements(_.filter(el.childNodes, filterOutSelector), 'span'),
    inlineForm = new InlineForm({ uri, path }).$mount();

  wrapped.classList.add(wrappedClass);
  el.appendChild(wrapped);
  el.appendChild(inlineForm.$el);
}

export function overlay() {
  console.log('create overlay form')
  return Promise.resolve()
}
