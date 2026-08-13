import _ from 'lodash';
import hashSum from 'hash-sum';
import delegate from 'delegate';
import { findAll, create, insertAfter } from '@nymag/dom';
import Vue from 'vue';
import { isLayout } from 'clayutils';
import store from '../core-data/store';
import { getData } from '../core-data/components';
import { refAttr, overlayClass } from '../utils/references';
import { getComponentNodes } from '../utils/walker';
import { getLayout } from '../utils/component-elements';
import { addSelector } from './select';
import addPlaceholder from './placeholders';
import addComponentList from './component-list';
import addComponentProp from './component-prop';
import addReorderability from './complex-list';
import addFocus from './focus';
import logger from '../utils/log';

const log = logger(__filename);

// position values that establish a containing block for absolutely positioned
// descendants. anything else (static, or a value the browser won't resolve)
// does not, so an overlay inside it would escape to a further ancestor
const positionedValues = ['relative', 'absolute', 'fixed', 'sticky'];

/**
 * add checksum for more accurate dom diffing when re-rendering components
 * note: checksum is based on component data
 * @param  {string} uri
 * @param  {Element} el
 */
function addDiffingChecksum(uri, el) {
  const data = getData(uri),
    hash = hashSum(data);

  el.setAttribute('data-checksum', hash);
}

/**
 * determine whether an iframe needs a click-blocking overlay
 * an iframe inside a non-rendered subtree cannot capture a click, so overlaying
 * it achieves nothing and leaves stray markup in the component. this is common:
 * analytics components ship iframes inside <noscript> (which browsers hide when
 * scripting is enabled) and ad/tracking components ship display:none iframes
 * note: fixed-position iframes also report a null offsetParent and are skipped —
 * the same tradeoff showVisible() makes in utils/component-elements
 * @param {Element} iframe
 * @returns {boolean}
 */
function needsOverlay(iframe) {
  return iframe.offsetParent !== null;
}

/**
 * make the iframe's own parent the containing block for its overlay
 * the overlay is absolutely positioned at 100%/100%, so it fills the nearest
 * positioned ancestor. when the parent is unpositioned that ancestor may be an
 * arbitrary distance up the tree, and the overlay then covers — and swallows
 * every click on — unrelated parts of the page, locking editors out entirely.
 * note: this makes the parent a containing block for any absolutely positioned
 * descendants that previously resolved against a further ancestor. that only
 * happens in edit mode, and only for components that don't already position
 * their own embed wrapper
 * @param {Element} parent
 */
function anchorOverlay(parent) {
  if (parent && !_.includes(positionedValues, getComputedStyle(parent).position)) {
    parent.style.position = 'relative';
  }
}

/**
 * add iframe overlays to any iframes inside a component
 * this blocks those iframes from capturing the clicks,
 * which allows us to preview embeds and videos while editing them
 * @param {Element} el
 */
export function addIframeOverlays(el) {
  const iframes = findAll(el, 'iframe'),
    iframesWithoutOverlays = _.filter(iframes, iframe => !iframe.classList.contains(overlayClass) && needsOverlay(iframe));

  _.each(iframesWithoutOverlays, (iframe) => {
    let overlay = create('<div data-ignore class="iframe-overlay-div"></div>');

    anchorOverlay(iframe.parentElement);
    insertAfter(iframe, overlay);
    iframe.classList.add(overlayClass);
  });
}

/**
 * kill all links in components
 * this allows users to edit components that contain links, and not be constantly redirected
 * note: right click + 'open in new tab' allows users to navigate those links
 * @param {string} uri
 */
function addLinkKiller(uri) {
  // note: this catches link clicks across components, so multiple handlers
  // might be fired when clicking a link. This is fine, since it's just doing preventDefault
  delegate(document.body, `[${refAttr}="${uri}"] a`, 'click', e => e.preventDefault());
  // make sure to also kill links that are the root element of a component!
  // (note: links can be the root element of a component, but don't put inline fields inside <a> tags, obvs)
  delegate(document.body, `a[${refAttr}="${uri}"]`, 'click', e => e.preventDefault());
}

/**
 * add decorators to individual component fields
 * e.g. child elements with `data-editable` or `data-placeholder`
 * @param {string} uri
 * @param {Element} el
 */
function addFieldDecorators(uri, el) {
  const editableNodes = getComponentNodes(el, 'editable'),
    placeholderNodes = getComponentNodes(el, 'placeholder'),
    reorderableNodes = getComponentNodes(el, 'reorderable');

  // add placeholders
  _.each(editableNodes, addPlaceholder.bind(null, uri));
  _.each(placeholderNodes, addPlaceholder.bind(null, uri));

  // add component lists / props
  _.each(editableNodes, addComponentList.bind(null, uri));
  _.each(editableNodes, addComponentProp.bind(null, uri));

  // add focus handler
  _.each(editableNodes, addFocus.bind(null, uri));

  _.each(reorderableNodes, addReorderability.bind(null, uri));
}

/**
 * decorate a single component element
 * add selector, placeholders, etc
 * note: make sure you decorate ALL elements of a component instance on the page
 * @param  {string} uri
 * @param {Element} el
 */
export function decorate(uri, el) {
  const path = isLayout(uri) ? 'state.layout.data' : `state.components['${uri}']`;

  if (!_.get(store, path)) {
    // warn if we try to decorate a component that doesn't have data in the store for some reason
    log.warn(`No data in the store for ${uri}!`, { action: 'decorate', uri });
  } else {
    // otherwise, decorate normally
    addLinkKiller(uri);
    addDiffingChecksum(uri, el);
    addSelector(uri, el);
    addIframeOverlays(el);
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

  // decorate the layout specifically, as the <html> tag won't be found by dom.findAll()
  decorate(layout.uri, layout.el);

  if (components) {
    _.forOwn(components, (val, key) => {
      if (key !== layout.uri && !_.includes(key, 'clay-kiln')) {
        // don't decorate kiln itself
        const els = findAll(`[${refAttr}="${key}"]`) || [];

        _.each(els, el => decorate(key, el));
      }
    });
  }

  // call vanity mutation after all decorators have finished (and, presumably, rendered anything they need to)
  Vue.nextTick(() => store.commit('FINISHED_DECORATING'));
}
