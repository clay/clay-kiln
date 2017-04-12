import _ from 'lodash';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';
import { getPrevVisible, getNextVisible } from '../utils/component-elements';
import { scrollToY } from '../utils/scroll';
import { checkValidity } from '../forms/native-validation';

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
  const current = _.get(state, 'ui.currentSelection');

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
function getElementOffset(el) {
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
  var offset = getElementOffset(el);

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
 * Scroll user to the component. "Weeee!" or "What the?"
 * @param {Element} el
 */
function scrollToComponent(el) {
  const toolBarHeight = 70,
    selectedBorderHeight = 4,
    pos = window.scrollY + el.getBoundingClientRect().top - toolBarHeight - selectedBorderHeight;

  scrollToY(pos, 1500, 'easeInOutQuint');
}

/**
 * navigate to the previous or next component
 * @param  {object} store
 * @param  {string} direction 'prev' or 'next'
 * @returns {Promise}
 */
export function navigateComponents(store, direction) {
  const currentComponent = _.get(store, 'state.ui.currentSelection');

  let newComponent;

  if (currentComponent && direction === 'prev') {
    newComponent = getPrevVisible(currentComponent);
  } else if (currentComponent && direction === 'next') {
    newComponent = getNextVisible(currentComponent);
  } else if (currentComponent) {
    throw new Error(`Unknown direction: "${direction}"!`);
  } // if no current component, don't do anything

  if (newComponent) {
    // always unfocus when explicitly navigating
    return store.dispatch('unfocus').then(() => {
      store.dispatch('select', newComponent);
      scrollToComponent(newComponent);
    });
  }
}

/**
 * unfocus currently-focused field/group
 * @param {object} store
 * @returns {Promise}
 */
export function unfocus({ commit, dispatch, state }) {
  const current = _.get(state, 'ui.currentFocus');

  if (current && checkValidity(state)) {
    commit(UN_FOCUS);
    return dispatch('closeForm');
  } else if (current) {
    console.warn('Unable to close form; Native validation failed.');
    return Promise.reject();
  } else {
    return Promise.resolve();
  }
}

export function focus(store, { uri, path, el, offset, appendText }) { // love too destructure
  offset = offset || 0; // if no offset is passed in, set it to zero

  return unfocus(store).then(() => {
    // note: we don't select components automatically when we focus,
    // because you cannot 'select' head components
    store.commit(FOCUS, uri, path);
    store.dispatch('openForm', { uri, path, el, offset, appendText });
  }).catch(_.noop);
}
