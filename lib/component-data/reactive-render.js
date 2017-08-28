import _ from 'lodash';
import setDOM from 'set-dom';
import { find, findAll, replaceElement } from '@nymag/dom';
import { RENDER_COMPONENT } from './mutationTypes';
import { RENDER_PAGE } from '../page-data/mutationTypes';
import { render as renderTemplate } from './template';
import { decorate } from '../decorators';
import { refAttr, editAttr, isComponent } from '../utils/references';
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

  // after everything is decorated, do a straight replace with the current element
  // (we're replacing rather than diffing because of speed and decorators)
  _.each(domEls, (el) => replaceElement(el, newEl));
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
 * replace and decorate a page that was rendered server-side
 * note: as of kiln v4.x, components will ALWAYS be rendered client-side. only pages will pass in server-side html
 * @param  {string} uri
 * @param  {Element} html
 * @param {array} paths that have changed
 * @returns {Promise}
 */
function renderServerHTML(uri, html, paths) {
  return Promise.resolve(updateDOM(uri, html, paths));
}

/**
 * render a component client-side based on data
 * @param  {string} uri
 * @param  {object} data
 * @param {array} paths that have changed
 * @returns {Promise}
 */
function renderClientData(uri, data, paths) {
  return renderTemplate(uri, data).then((html) => updateDOM(uri, html, paths));
}

/**
 * reactive render plugin
 * listens to render events and updates the dom
 * @param  {object} store
 * @param {string} uri
 * @param {object} [data]
 * @param {Element} [html]
 * @param {string} snapshot
 * @param {array} paths
 * @returns {Promise}
 */
export function render(store, {uri, data, html, snapshot, paths}) {
  let promise;

  if (html) {
    // server-side legacy html (or new layout html)
    promise = renderServerHTML(uri, html, paths);
  } else {
    // client-side html, passing through handlebars template
    promise = renderClientData(uri, data, paths);
  }

  return promise.then(() => {
    const currentSelected = _.get(store, 'state.ui.currentSelection.uri'),
      newEl = currentSelected && find(`[${refAttr}="${currentSelected}"]`);

    let selectionPromise;

    // re-select the currently-selected component with a new element,
    // just in case the currently-selected component was re-rendered
    if (newEl) {
      selectionPromise = store.dispatch('select', newEl);
    } else {
      // if there's nothing selected, OR if the selected component was destroyed when
      // re-rendering, make sure we trigger unselect
      selectionPromise = store.dispatch('unselect');
    }

    return selectionPromise.then(() => {
      if (isComponent(uri)) {
        store.commit(RENDER_COMPONENT, { uri, data, html, snapshot, paths });
      } else {
        store.commit(RENDER_PAGE, { uri, data, html, snapshot, paths });
      }
    });
  });
}
