import _ from 'lodash';
import { SET_CURSOR, UNDO, REDO } from './mutationTypes';

/**
 * @module undo
 */

const MAX_SNAPSHOTS = 50;

// keep the snapshot history out of the store,
// to prevent the components/page state from affecting snapshots
let history = [];

/**
 * get changed components, used by undo and redo
 * @param  {object} current
 * @param  {object} compare (prev/next components object)
 * @return {object}
 */
function getChangedComponents(current, compare) {
  return _.reduce(current, (result, data, uri) => {
    if (!_.isEqual(data, compare[uri])) {
      result[uri] = { data, prevData: compare[uri] };
    }

    return result;
  }, {});
}

/**
 * create snapshot. called from the plugin listening to batched renders
 * @param  {object} store
 */
export function createSnapshot(store) {
  const components = _.cloneDeep(store.state.components),
    pageData = _.cloneDeep(store.state.page.data),
    snapshot = { components, pageData };

  if (history.length >= MAX_SNAPSHOTS) {
    history.shift();
  }

  history.push(snapshot);
  store.commit(SET_CURSOR, { cursor: history.length - 1, end: history.length - 1 }); // set the cursor at the last snapshot
}

/**
 * "You're a fixed point in time and space. You're a fact. That's never meant to happen."
 * when doing a manual save from some point in history, we need to
 * remove snapshots after that point (to preserve the expected undo functionality)
 * @param {object} store
 */
export function setFixedPoint(store) {
  const cursor = store.state.undo.cursor,
    atEnd = store.state.undo.atEnd,
    index = cursor + 1;

  if (!atEnd) {
    // there are "redo" snapshots after our current place in history. remove them.
    history = history.slice(0, index);
    store.commit(SET_CURSOR, { cursor, end: history.length - 1 }); // sets atEnd: true
  }
}

/**
 * render multiple components at once
 * @param  {object} changedComponents
 * @param {object} store
 */
function saveChangedComponents(changedComponents, store) {
  _.forOwn(changedComponents, ({ data, prevData }, uri) => store.dispatch('saveComponent', {
    uri, data, snapshot: false, prevData
  })); // don't pass event ID, do tell it to not create snapshots
}

/**
 * undo: sets cursor back one, re-saves affected components with old data
 * @param  {object} store
 */
export function undo(store) {
  let latestComponents,
    changedComponents;

  if (!store.state.undo.atStart) {
    // can undo
    store.commit(UNDO, history);
    latestComponents = history[store.state.undo.cursor + 1].components; // get the component obj one snapshot ahead
    changedComponents = getChangedComponents(store.state.components, latestComponents);
    saveChangedComponents(changedComponents, store);
  }
}

/**
 * redo: sets cursor forward one, re-saves affected components with new data
 * @param  {object} store
 */
export function redo(store) {
  let prevComponents,
    changedComponents;

  if (!store.state.undo.atEnd) {
    // can redo
    store.commit(REDO, history);
    prevComponents = history[store.state.undo.cursor - 1].components; // get the component obj one snapshot behind
    changedComponents = getChangedComponents(store.state.components, prevComponents);
    saveChangedComponents(changedComponents, store);
  }
}
