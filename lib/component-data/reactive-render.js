import setDOM from 'set-dom';
import { find, findAll } from '@nymag/dom';
import { RENDER_COMPONENT } from './mutationTypes';
import { RENDER_PAGE } from '../page-data/mutationTypes';
import { render as renderTemplate } from './template';
import { decorate } from '../decorators';
import { refAttr, editAttr } from '../utils/references';
import addPlaceholder from '../decorators/placeholders';
import addComponentList from '../decorators/component-list';
import { getComponentFragment, getComponentListFragment, replaceHeadComponent, replaceHeadList } from '../utils/head-components';

/**
 * intelligently update component in the <head>
 * note: these cannot contain child components
 * @param {string} uri
 * @param {DocumentFragment} newEl
 */
function updateHeadComponent(uri, newEl) {
  const oldEl = getComponentFragment(uri);

  // diff the fragments, then replace the current dom with the diff
  // note: this is faster than wholely replacing the element with the new one
  setDOM(oldEl, newEl);
  replaceHeadComponent(uri, oldEl);
}

/**
 * update a component list in the head
 * @param  {string} uri
 * @param  {string} path
 * @param  {Document} newEl
 */
function updateHeadList(uri, path, newEl) {
  const oldList = getComponentListFragment(path),
    newList = getComponentListFragment(path, newEl);

  // diff the fragments, then replace the current dom with the diff
  // note: this is faster than wholely replacing the element with the new one
  setDOM(oldList, newList);
  replaceHeadList(path, oldList);
}

/**
 * intelligently update component in the <body>
 * @param  {string} uri
 * @param {Element} newEl
 */
function updateBodyComponent(uri, newEl) {
  const children = findAll(newEl, `[${refAttr}]`) || [],
    domEls = findAll(`[${refAttr}="${uri}"]`) || [];

  // first, decorate any children
  _.each(children, (child) => decorate(child.getAttribute(refAttr), child));

  // then, decorate the component itself
  decorate(uri, newEl);

  // after everything is decorated, diff it with the actual dom
  _.each(domEls, (el) => setDOM(el, newEl));
}

/**
 * update a component list in the body
 * @param  {string} uri
 * @param  {Element} oldList
 * @param  {Element} newList
 */
function updateBodyList(uri, oldList, newList) {
  const children = findAll(newList, `[${refAttr}]`) || [];

  // first, decorate the components (and their children) inside the list
  _.each(children, (child) => decorate(child.getAttribute(refAttr), child));

  // then, decorate the list element itself (only placeholder and component-list)
  addPlaceholder(uri, newList);
  addComponentList(uri, newList);

  // after everything is decorated, diff it with the actual dom
  setDOM(oldList, newList);
}

/**
 * intelligently update the <html> element
 * triggered when the page or layout is saved
 * note: this will really just replace the component list that have been updated,
 * by calling updateHeadComponent() or updateBodyComponent()
 * @param {string} uri
 * @param {Document} newEl
 * @param {array} paths
 */
function updateRootDOM(uri, newEl, paths) {
  _.each(paths, (path) => {
    const newList = find(newEl, `[${editAttr}="${path}"]`),
      oldList = find(`[${editAttr}="${path}"]`);

    if (newList && oldList) {
      // updating a component list in the body!
      updateBodyList(uri, oldList, newList);
    } else {
      // updating a component list in the head!
      updateHeadList(uri, path, newEl);
    }
  });
}

/**
 * update the dom with the newly-rendered component elements
 * note: this uses intelligent dom diffing, so only changes will update
 * @param  {string} uri
 * @param  {Element} newEl
 * @param {array} paths used by page/layout render to diff specific component lists
 */
export function updateDOM(uri, newEl, paths) {
  const isElement = newEl.nodeType === newEl.ELEMENT_NODE,
    isFragment = newEl.nodeType === newEl.DOCUMENT_FRAGMENT_NODE,
    isDocument = newEl.nodeType === newEl.DOCUMENT_NODE;

  if (isElement) {
    // regular old component
    updateBodyComponent(uri, newEl);
  } else if (isFragment) {
    // head component
    updateHeadComponent(uri, newEl);
  } else if (isDocument) {
    // page or layout. we'll have to find the invidividual component list and diff it with the old one
    updateRootDOM(uri, newEl, paths);
  } else {
    console.error(`Unknown node type (${newEl.nodeType}) for "${uri}"`);
  }
}

/**
 * replace and decorate a component/page that was rendered server-side
 * @param  {string} uri
 * @param  {Element} html
 * @param {array} paths that have changed
 */
function renderServerHTML(uri, html, paths) {
  updateDOM(uri, html, paths);
}

/**
 * render a component client-side based on data
 * @param  {string} uri
 * @param  {object} data
 * @param {array} paths that have changed
 */
function renderClientData(uri, data, paths) {
  renderTemplate(uri, data).then((html) => updateDOM(uri, html, paths));
}

/**
 * reactive render plugin
 * listens to render events and updates the dom
 * @param  {object} store
 */
export default function reactiveRender(store) {
  store.subscribe((mutation) => {
    if (mutation.type === RENDER_COMPONENT) {
      const uri = mutation.payload.uri,
        data = mutation.payload.data,
        html = mutation.payload.html,
        paths = mutation.payload.paths;

      if (html) {
        // server-side legacy html (or new layout html)
        renderServerHTML(uri, html, paths);
      } else if (data) {
        renderClientData(uri, data, paths);
      }
    } else if (mutation.type === RENDER_PAGE) {
      const uri = mutation.payload.uri,
        html = mutation.payload.html,
        paths = mutation.payload.paths;

      // render new page html
      renderServerHTML(uri, html, paths);
    }
  });
}
