import _ from 'lodash';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';
import { getPrevVisible, getNextVisible, getParentComponent, getFieldEl } from '../utils/component-elements';
import { refAttr, layoutAttr } from '../utils/references';
import { scrollToY } from '../utils/scroll';
import { checkValidity } from '../forms/native-validation';
import { getParentField } from './select';

let isCurrentlyFocusing = false;

/**
 * unselect currently-selected component
 * @param {object} store
 */
export function unselect({ commit, state }) {
  const current = _.get(state, 'ui.currentSelection.el');

  if (current) {
    current.classList.remove('selected');
    commit(UN_SELECT);
  }
}

/**
 * select a component
 * @param {object} store
 * @param  {element} el
 */
export function select(store, el) {
  const uri = el.getAttribute(refAttr),
    parent = getParentComponent(el),
    parentURI = parent && (parent.getAttribute(layoutAttr) || parent.getAttribute(refAttr)),
    parentField = parentURI && getParentField(uri, parentURI);

  // only one component can be selected at a time
  unselect(store);

  // selected component gets .selected
  if (el.tagName !== 'HTML') {
    el.classList.add('selected');
    store.commit(SELECT, { uri, el, parentField, parentURI });
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

export function focus(store, { uri, path, el, offset, appendText }) {
  const isServerSaving = _.get(store, 'state.ui.currentServerSave');

  offset = offset || 0; // if no offset is passed in, set it to zero

  if (!isCurrentlyFocusing && !isServerSaving) {
    isCurrentlyFocusing = true;
    return unfocus(store).then(() => {
      // use the original el if it's in the doc,
      // but if we're closing, rerendering, and opening a different form in the same component
      // the original el may have been detached
      const fieldEl = document.body.contains(el) ? el : getFieldEl(uri, path);

      // note: we don't select components automatically when we focus,
      // because you cannot 'select' head components
      store.commit(FOCUS, uri, path);
      store.dispatch('openForm', { uri, path, el: fieldEl, offset, appendText }).then(() => {
        isCurrentlyFocusing = false;
      });
    }).catch(_.noop);
  }
}
