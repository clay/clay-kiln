import _ from 'lodash';
import { SELECT, UN_SELECT, FOCUS, UN_FOCUS } from './mutationTypes';
import { getPrevVisible, getNextVisible, getParentComponent, getFieldEl, getComponentEl } from '../utils/component-elements';
import { refAttr, layoutAttr } from '../utils/references';
import { scrollToY } from '../utils/scroll';
import { getParentField } from './select';

/**
 * @module decorators
 */

let isCurrentlyFocusing = false;

/**
 * unselect currently-selected component
 * @param {object} store
 */
export function unselect({ commit, state }) {
  const current = _.get(state, 'ui.currentSelection.uri'),
    currentEl = current && getComponentEl(current);

  if (currentEl) {
    currentEl.classList.remove('selected');
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
    store.commit(SELECT, { uri, parentField, parentURI });
  }
}

/**
 * Scroll user to the component. "Weeee!" or "What the?"
 * @param {object} store
 * @param {Element} el
 */
export function scrollToComponent(store, el) {
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
  const currentComponent = _.get(store, 'state.ui.currentSelection'),
    currentEl = currentComponent && getComponentEl(currentComponent.uri);

  let newComponent;

  if (currentEl && direction === 'prev') {
    newComponent = getPrevVisible(currentEl);
  } else if (currentEl && direction === 'next') {
    newComponent = getNextVisible(currentEl);
  } else if (currentEl) {
    throw new Error(`Unknown direction: "${direction}"!`);
  } // if no current component, don't do anything

  if (newComponent) {
    // always unfocus when explicitly navigating
    return store.dispatch('unfocus').then(() => {
      store.dispatch('select', newComponent);
      store.dispatch('scrollToComponent', newComponent);
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

  if (current) {
    commit(UN_FOCUS);
    return dispatch('closeForm');
  } else {
    return Promise.resolve();
  }
}

export function focus(store, { uri, path, el, offset, appendText, pos }) {
  const isComponentSaving = _.get(store, 'state.ui.currentlySaving');

  offset = offset || 0; // if no offset is passed in, set it to zero

  if (!isCurrentlyFocusing && !isComponentSaving) {
    isCurrentlyFocusing = true;
    return store.dispatch('unfocus').then(() => {
      // use the original el if it's in the doc,
      // but if we're closing, rerendering, and opening a different form in the same component
      // the original el may have been detached
      const fieldEl = document.body.contains(el) ? el : getFieldEl(uri, path);

      // note: we don't select components automatically when we focus,
      // because you cannot 'select' head components
      store.commit(FOCUS, {uri, path});
      store.dispatch('openForm', { uri, path, el: fieldEl, offset, appendText, pos }).then(() => {
        isCurrentlyFocusing = false;
      });
    }).catch(_.noop);
  }
}
