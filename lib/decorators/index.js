import _ from 'lodash';
import { findAll, create, insertAfter } from '@nymag/dom';
import store from '../core-data/store';
import { refAttr, overlayClass } from '../utils/references';
import { getComponentNodes } from '../utils/walker';
import { getLayout } from '../utils/component-elements';
import { addSelector } from './select';
import addPlaceholder from './placeholders';
import addComponentList from './component-list';
import addComponentProp from './component-prop';
import addFocus from './focus';

/**
 * add iframe overlays to any iframes inside a component
 * this blocks those iframes from capturing the clicks,
 * which allows us to preview embeds and videos while editing them
 * @param {Element} el
 */
function addIframeOverlays(el) {
  const iframes = findAll(el, 'iframe'),
    iframesWithoutOverlays = _.filter(iframes, (iframe) => !iframe.classList.contains(overlayClass));

  _.each(iframesWithoutOverlays, (iframe) => {
    let overlay = create('<div data-ignore class="iframe-overlay-div"></div>');

    insertAfter(iframe, overlay);
    iframe.classList.add(overlayClass);
  });
}

/**
 * kill all links in components
 * this allows users to edit components that contain links, and not be constantly redirected
 * note: right click + 'open in new tab' allows users to navigate those links
 * @param {Element} el
 */
function addLinkKiller(el) {
  const links = findAll(el, 'a');

  // note: because of findAll, this adds the event listener to child components as well,
  // but that's not a problem because all components get fully reloaded when saving.
  // switching this to use a treewalker _might_ give us some performance increases
  // if the multiple event listeners become an issue
  _.each(links, (link) => {
    link.addEventListener('click', (e) => e.preventDefault());
    link.setAttribute('data-ignored', true); // set an attribute, so the handler will be re-added when re-rendering
  });
}

/**
 * add decorators to individual component fields
 * e.g. child elements with `data-editable` or `data-placeholder`
 * @param {string} uri
 * @param {Element} el
 */
function addFieldDecorators(uri, el) {
  const editableNodes = getComponentNodes(el, 'editable'),
    placeholderNodes = getComponentNodes(el, 'placeholder');

  // add placeholders
  _.each(editableNodes, addPlaceholder.bind(null, uri));
  _.each(placeholderNodes, addPlaceholder.bind(null, uri));

  // add component lists / props
  _.each(editableNodes, addComponentList.bind(null, uri));
  _.each(editableNodes, addComponentProp.bind(null, uri));

  // add focus handler
  _.each(editableNodes, addFocus.bind(null, uri));
}

/**
 * decorate a single component element
 * add selector, placeholders, etc
 * note: make sure you decorate ALL elements of a component instance on the page
 * @param  {string} uri
 * @param {Element} el
 */
export function decorate(uri, el) {
  if (!_.get(store, `state.components['${uri}']`)) {
    // warn if we try to decorate a component that doesn't have data in the store for some reason,
    // e.g. dynamically-inserted components in legacy server.js files
    console.warn(`No data in the store for ${uri}!`);
  } else {
    // otherwise, decorate normally
    addSelector(uri, el);
    addIframeOverlays(el);
    addLinkKiller(el);
    addFieldDecorators(uri, el);
  }
}

/**
 * decorate all components on the page at once
 * note: this is called when the page initially loads, NOT when individual components reload
 * note: this also decorates the layout
 */
export function decorateAll() {
  const components = _.get(store, 'state.components'),
    layout = getLayout();

  if (components) {
    _.forOwn(components, (val, key) => {
      if (key === layout.uri) {
        // decorate the layout specifically, as the <html> tag won't be found by dom.findAll()
        decorate(layout.uri, layout.el);
      } else if (!_.includes(key, 'clay-kiln')) {
        // don't decorate kiln itself
        const els = findAll(`[${refAttr}="${key}"]`) || [];

        _.each(els, (el) => decorate(key, el));
      }
    });
  }
}
