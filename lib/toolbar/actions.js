import _ from 'lodash';
import Vue from 'vue';
import { SHOW_STATUS, HIDE_STATUS, START_PROGRESS, FINISH_PROGRESS } from './mutationTypes';

export function showStatus({ commit }, status) {
  commit(HIDE_STATUS);
  // wait a tick before showing the new status
  Vue.nextTick(() => {
    commit(SHOW_STATUS, status);
  });
}
/**
 * get left offset for pane
 * @param {Element} el of button
 * @returns {number}
 */
function getLeftOffset(el) {
  var offsetLeft = el.offsetLeft;

  while (el = el.offsetParent) {
    offsetLeft += el.offsetLeft;
  }

  return offsetLeft;
}

/**
 * toggle pane from a toolbar button
 * note: this is mostly a passthrough to pane actions,
 * but does toolbar-button-specific logic to close a pane if it's open
 * @param  {object} store
 * @param  {object} options for the pane
 * @param  {Element} button
 * @param {boolean} offset false if we shouldn't apply offset logic
 * @return {Promise|undefined}
 */
export function togglePane(store, { options, button, offset }) {
  const currentPane = _.get(store, 'state.ui.currentPane'),
    currentName = currentPane && currentPane.name,
    name = options.name;

  if (offset !== false) {
    options = _.assign({}, options, {
      offset: {
        left: getLeftOffset(button),
        width: button.offsetWidth
      }
    });
  }

  if (name === currentName) {
    // close pane!
    return store.dispatch('closePane');
  } else {
    // open (or change) pane!
    return store.dispatch('openPane', options);
  }
}

/**
 * start progress bar. if already started, this will cause a slight pause
 * before continuing the progress bar
 * @param  {function} commit
 * @param  {string} type e.g. 'save' or 'publish'
 */
export function startProgress({ commit }, type) {
  console.log('start', type)
  commit(START_PROGRESS, type);
}

/**
 * finish the progress bar.
 * @param  {function} commit
 * @param  {string} type e.g. 'save' or 'publish'
 */
export function finishProgress({ commit }, type) {
  console.log('finish', type)
  commit(FINISH_PROGRESS, type);
}
