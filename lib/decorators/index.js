import _ from 'lodash';
import { findAll, create, insertAfter } from '@nymag/dom';
import store from '../core-data/store';
import { refAttr } from '../utils/references';
import { getComponentNodes } from '../utils/walker';
import { addSelector } from './select';
import addPlaceholder from './placeholders';

const overlayClass = 'iframe-overlay';

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
    let overlay = create('<div class="iframe-overlay-div"></div>');

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
  _.each(links, (link) => link.addEventListener('click', (e) => e.preventDefault()));
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

  _.each(editableNodes, addPlaceholder.bind(null, uri));
  _.each(placeholderNodes, addPlaceholder.bind(null, uri));
}

/**
 * decorate components
 * add selector, placeholders, etc
 * @param  {string} uri
 */
export function decorate(uri) {
  const els = findAll(`[${refAttr}="${uri}"]`);

  if (els) {
    // if the component exists more than once on a page, make sure we decorate every element
    _.each(els, (el) => {
      addSelector(uri, el);
      addIframeOverlays(el);
      addLinkKiller(el);
      addFieldDecorators(uri, el);
    });
  }
}


export function decorateAll() {
  const components = _.get(store, 'state.components');

  if (components) {
    _.forOwn(components, (val, key) => {
      if (!_.includes(key, 'clay-kiln')) {
        // don't decorate kiln itself
        decorate(key, val);
      }
    });
  }
}
