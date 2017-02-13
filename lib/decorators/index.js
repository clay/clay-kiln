import _ from 'lodash';
import { findAll, create, insertAfter } from '@nymag/dom';
import store from '../core-data/store';
import { getComponentName, refAttr } from '../utils/references';
import { addSelector } from './select';

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

  _.each(links, (link) => link.addEventListener('click', (e) => e.preventDefault()));
}

/**
 * decorate components
 * add selector, placeholders, etc
 * @param  {string} uri
 */
export function decorate(uri) {
  const schema = _.get(store, `state.schemas["${getComponentName(uri)}"]`),
    els = findAll(`[${refAttr}="${uri}"]`);

  if (els) {
    _.each(els, (el) => {
      addSelector(uri, el);
      addIframeOverlays(el);
      addLinkKiller(el);
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
