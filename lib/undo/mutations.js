import _ from 'lodash';
import { CREATE_SNAPSHOT, UNDO, REDO } from './mutationTypes';

export const MAX_SNAPSHOTS = 50;

export default {
  [CREATE_SNAPSHOT]: (state) => {
    const components = _.cloneDeep(state.components),
      pageData = _.cloneDeep(state.page.data);

    if (state.undo.history.length >= MAX_SNAPSHOTS) {
      state.undo.history.shift();
    }
    state.undo.history.push({ components, pageData });
    state.undo.cursor = state.undo.history.length - 1; // set the cursor at the last snapshot
    // note: if a snapshot is created when someone is in an undo'd state, it's just
    // added to the end of the history, so they can never lose any undone/redone work
    return state;
  },
  [UNDO]: (state) => {
    if (state.undo.cursor > 0) {
      // can undo
      state.undo.cursor--;
      _.set(state, 'components', state.undo.history[state.undo.cursor].components);
      _.set(state, 'page.data', state.undo.history[state.undo.cursor].pageData);
    }
    return state;
  },
  [REDO]: (state) => {
    if (state.undo.cursor < state.undo.history.length - 1) {
      // can redo
      state.undo.cursor++;
      _.set(state, 'components', state.undo.history[state.undo.cursor].components);
      _.set(state, 'page.data', state.undo.history[state.undo.cursor].pageData);
    }
    return state;
  }
};
