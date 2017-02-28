import { OPEN_PANE, CLOSE_PANE, CHANGE_PANE } from './mutationTypes';

/**
 * open a new pane (or switch to a new pane if one is currently open)
 * @param  {object} store
 * @param  {object} options
 * @return {Promise}
 */
export function openPane(store, options) {
  const currentPane = _.get(store, 'state.ui.currentPane');

  if (currentPane) {
    // there's already a pane open, so do a smooth transition
    options.previous = currentPane;
    store.commit(CHANGE_PANE);
  }

  // unfocus, in case the open pane is a form
  return store.dispatch('unfocus').then(() => store.commit(OPEN_PANE, options));
}

export function closePane({dispatch, commit}) {
  // unfocus, in case we have an open form in a pane
  return dispatch('unfocus').then(() => commit(CLOSE_PANE));
}
