import { get } from 'lodash';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';

const selectorHeight = 56; // selector menus are 48px tall, offset is 8px

/**
 * remove top/bottom padding from body
 */
function removePadding() {
  document.body.style['padding-top'] = '0px';
  document.body.style['padding-bottom'] = '0px';
}

/**
 * unselect currently-selected component
 * @param {object} store
 */
export function unselect({ commit, state }) {
  const current = get(state, 'ui.currentSelection');

  if (current) {
    current.classList.remove('kiln-suppress-animation'); // unsuppress initialFadeInOut animation
    current.classList.remove('selected');
    removePadding();
    commit(UN_SELECT);
  }
}

/**
 * get the top and bottom offset of an element
 * @param {Element} el
 * @returns {object}
 */
function getOffset(el) {
  var rect = el.getBoundingClientRect(),
    body = document.body,
    doc = document.documentElement,
    bodyHeight = body.getBoundingClientRect().height,
    scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop,
    clientTop = doc.clientTop || body.clientTop || 0,
    top  = rect.top +  scrollTop - clientTop,
    bottom =  bodyHeight - (rect.bottom + scrollTop - clientTop);

  return { top: Math.round(top), bottom: Math.round(bottom) };
}

/**
 * add padding to top/bottom of document to account for selector menu overflow
 * note: this assumes document.body has NO padding normally
 * @param {Element} el that was selected
 */
function addPadding(el) {
  var offset = getOffset(el);

  // check top overflow
  if (offset.top < selectorHeight) {
    document.body.style['padding-top'] = `${selectorHeight - offset.top}px`;
  }

  if (offset.bottom < selectorHeight) {
    document.body.style['padding-bottom'] = `${selectorHeight - offset.bottom}px`;
  }
}

/**
 * select a component
 * @param {object} store
 * @param  {element} el
 */
export function select(store, el) {
  // only one component can be selected at a time
  unselect(store);

  // if we're clicking into element directly, don't run the initialFadeInOut animation
  // note: we're adding an otherwise-unused css rule on :hover, which we check
  // when selecting to see if the mouse/pointer is currently hovering over the element
  if (getComputedStyle(el).getPropertyValue('backface-visibility') === 'hidden') {
    el.classList.add('kiln-suppress-animation');
  }

  // selected component gets .selected
  if (el.tagName !== 'HTML') {
    el.classList.add('selected');
    addPadding(el);
    store.commit(SELECT, el);
  }
}

/**
 * unfocus currently-focused field/group
 * @param {object} store
 */
export function unfocus({ commit, state }) {
  const current = get(state, 'ui.currentFocus');

  if (current) {
    commit(UN_FOCUS);
  }
}

export function focus(store, { uri, path, el }) { // love too destructure
  unfocus(store);
  store.commit(FOCUS, uri, path);
}
