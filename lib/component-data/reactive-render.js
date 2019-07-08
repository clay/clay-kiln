import _ from 'lodash';
import setDOM from 'set-dom';
import { find, findAll, replaceElement } from '@nymag/dom';
import { isComponent } from 'clayutils';
import { RENDER_COMPONENT } from './mutationTypes';
import { RENDER_PAGE } from '../page-data/mutationTypes';
import { render as renderTemplate } from './template';
import { decorate } from '../decorators';
import { isLayout, getLayoutName } from 'clayutils';
import { refAttr, editAttr, getComponentName } from '../utils/references';
import { destroySelector } from '../decorators/select';
import { destroyPlaceholders } from '../decorators/placeholders';
import addPlaceholder from '../decorators/placeholders';
import addComponentList from '../decorators/component-list';
import {
  getComponentFragment, getComponentListFragment, replaceHeadComponent, replaceHeadList
} from '../utils/head-components';
import { getComponentEl } from '../utils/component-elements';
import logger from '../utils/log';

const log = logger(__filename);

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
  const domEls = findAll(`[${refAttr}="${uri}"]`) || [];

  // do a straight replace with the current element
  // (we're replacing rather than diffing because of speed and decorators)
  _.each(domEls, (el) => {
    // first, replace the element
    replaceElement(el, newEl);

    // then, decorate any children
    _.each(findAll(newEl, `[${refAttr}]`) || [], (child) => {
      const childURI = child.getAttribute(refAttr);

      destroySelector(childURI);
      destroyPlaceholders(childURI);
      decorate(childURI, child);
    });

    // then, decorate the component itself
    destroySelector(uri);
    destroyPlaceholders(uri);
    decorate(uri, newEl);
  });
}

/**
 * update a component list in the body
 * @param  {string} uri
 * @param  {Element} oldList
 * @param  {Element} newList
 */
function updateBodyList(uri, oldList, newList) {
  const children = findAll(newList, `[${refAttr}]`) || [];

  replaceElement(oldList, newList);

  // first, decorate the list element itself (only placeholder and component-list)
  addPlaceholder(uri, newList);
  addComponentList(uri, newList);

  // then, decorate the components (and their children) inside the list
  _.each(children, child => decorate(child.getAttribute(refAttr), child));
}

/**
 * intelligently update the <html> element
 * triggered when the layout is saved
 * @param {string} uri
 * @param {Document} newEl
 * @param {array} paths
 */
function updateLayout(uri, newEl, paths) {
  if (paths.length === 0) {
    paths.push('main');
  }
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

function hasComment(el) {
  const child = el.firstChild;

  if (child) {
    return child.nodeType === child.COMMENT_NODE;
  } else {
    return false;
  }
}

function hasURIComment(el) {
  const child = el.firstChild;

  if (child) {
    return child.data ? !!child.data.match(/data-uri=".*?"/) : false;
  } else {
    return false;
  }
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
    isDocument = newEl.nodeType === newEl.DOCUMENT_NODE,
    isText = newEl.nodeType === newEl.TEXT_NODE,
    // a full-page fragment happens when re-rendering the layout. we need to explicitly check that
    // a) the first node is not a comment, or
    // b) the first node isn't <!-- data-uri -->
    // because that would indicate we're re-rendering a single head component
    isFullPageFragment = isFragment && (!hasComment(newEl) || !hasURIComment(newEl));

  if (isElement) {
    // regular component in the body
    updateBodyComponent(uri, newEl);
  } else if (isFullPageFragment) {
    // re-rendering a component list in the layout
    updateLayout(uri, newEl, paths);
  } else if (isFragment) {
    // re-rendering a head component
    updateHeadComponent(uri, newEl);
  } else if (isDocument) {
    // re-rendering a component list in the page
    updateLayout(uri, newEl, paths);
  } else if (!isText) { // text nodes (like comments with data-uri in them) that don't render anything else in edit mode don't need to be re-rendered or throw an error
    log.error(`Unknown node type (${newEl.nodeType}) for "${uri}"`, { action: 'updateDOM' });
  }
}

/**
 * replace and decorate a page that was rendered server-side
 * note: in kiln v4.x and above, components (including layouts) will ALWAYS be rendered client-side. only pages will pass in server-side html
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
  const name = isLayout(uri) ? getLayoutName(uri) : getComponentName(uri);

  return renderTemplate(uri, data)
    .then(html => updateDOM(uri, html, paths))
    .catch((e) => {
      log.error(`Error rendering ${name}: ${e.message}`, { action: 'render' });

      return Promise.reject(e);
    });
}

/**
 * reactive render plugin
 * listens to render events and updates the dom
 * @param  {object} store
 * @param {string} uri
 * @param {object} [data]
 * @param {Element} [html] for page re-rendering
 * @param {string} snapshot
 * @param {array} paths
 * @returns {Promise}
 */
export function render(store, {
  uri, data, html, snapshot, paths
}) {
  let promise;

  if (html) {
    // server-rendered html, because we're updating page data
    promise = renderServerHTML(uri, html, paths);
  } else {
    // component, layout, etc client-rendered stuff
    promise = renderClientData(uri, data, paths);
  }

  return promise.then(() => {
    const currentSelected = _.get(store, 'state.ui.currentSelection.uri'),
      newEl = currentSelected && getComponentEl(currentSelected);

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

    return selectionPromise
      .catch((e) => {
        log.error(`Error selecting rendered component (${getComponentName(uri)}): ${e.message}`, { action: 'render' });

        return Promise.reject(e);
      })
      .then(() => {
        if (isComponent(uri)) {
          store.commit(RENDER_COMPONENT, {
            uri, data, snapshot, paths
          });
        } else {
          store.commit(RENDER_PAGE, {
            uri, data, snapshot, paths
          });
        }
      });
  });
}
