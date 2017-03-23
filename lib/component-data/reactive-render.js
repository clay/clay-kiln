import setDOM from 'set-dom';
import { findAll } from '@nymag/dom';
import { RENDER_COMPONENT } from './mutationTypes';
import { render as renderTemplate } from './template';
import { decorate } from '../decorators';
import { refAttr } from '../utils/references';

/**
 * intelligently update component in the <head>
 * note: these cannot contain child components
 * @param {string} uri
 * @param {DocumentFragment} newEl
 */
function updateHeadComponent(uri, newEl) {
  console.log(`update head component: ${uri}`, newEl)
}

/**
 * intelligently update component in the <body>
 * @param  {string} uri
 * @param {Element} newEl
 */
function updateBodyComponent(uri, newEl) {
  let children = findAll(newEl, `[${refAttr}]`) || [],
    domEls = findAll(`[${refAttr}="${uri}"]`) || [];

  // first, decorate any children
  _.each(children, (child) => decorate(child.getAttribute(refAttr), child));

  // then, decorate the component itself
  decorate(uri, newEl);

  // after everything is decorated, diff it with the actual dom
  _.each(domEls, (el) => setDOM(el, newEl));
}

/**
 * intelligently update the <html> element
 * triggered when the page or layout is saved
 * note: this will really just replace the children that have been updated,
 * by calling updateHeadComponent() or updateBodyComponent()
 * @param {string} uri
 * @param {Document} newEl
 */
function updateRootDOM(uri, newEl) {
  console.log(`update root dom for ${uri}`, newEl)
}

/**
 * update the dom with the newly-rendered component elements
 * note: this uses intelligent dom diffing, so only changes will update
 * @param  {string} uri
 * @param  {Element} newEl
 */
export function updateDOM(uri, newEl) {
  const isRootNode = newEl.nodeType === newEl.DOCUMENT_NODE,
    isElement = newEl.nodeType === newEl.ELEMENT_NODE,
    isFragment = newEl.nodeType === newEl.DOCUMENT_FRAGMENT_NODE;

  if (isRootNode) {
    updateRootDOM(uri, newEl);
  } else if (isElement) {
    updateBodyComponent(uri, newEl);
  } else if (isFragment) {
    updateHeadComponent(uri, newEl);
  } else {
    console.error(`Unknown node type (${newEl.nodeType}) for "${uri}"`);
  }
}

/**
 * replace and decorate a component that was rendered server-side
 * note: this will be removed in kiln v2.0
 * @param  {string} uri
 * @param  {Element} html
 */
function renderServerHTML(uri, html) {
  // replace the html (of all matching elements) and decorate
  updateDOM(uri, html);
}

/**
 * render a component client-side based on data
 * @param  {string} uri
 * @param  {object} data
 */
function renderClientData(uri, data) {
  // render, then replace the html (of all matching elements) and decorate
  renderTemplate(uri, data).then((html) => updateDOM(uri, html));
}

export default function reactiveRender(store) {
  store.subscribe((mutation) => {
    if (mutation.type === RENDER_COMPONENT) {
      const uri = mutation.payload.uri,
        data = mutation.payload.data,
        html = mutation.payload.html;

      if (html) {
        // server-side legacy html
        renderServerHTML(uri, html);
      } else if (data) {
        renderClientData(uri, data);
      }
    }
  });
}
