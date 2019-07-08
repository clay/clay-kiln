import _ from 'lodash';
import { SET_CURSOR, UNDO, REDO } from './mutationTypes';

function getCursorPosition(cursor, end) {
  return {
    cursor: cursor,
    atStart: cursor === 0,
    atEnd: cursor === end
  };
}

export default {
  [SET_CURSOR]: (state, { cursor, end }) => {
    state.undo = _.assign({}, state.undo, getCursorPosition(cursor, end));

    return state;
  },
  [UNDO]: (state, history) => {
    state.undo = _.assign({}, state.undo, getCursorPosition(state.undo.cursor - 1, history.length - 1));
    _.set(state, 'components', _.cloneDeep(history[state.undo.cursor].components));
    _.set(state, 'page.data', _.cloneDeep(history[state.undo.cursor].pageData));

    return state;
  },
  [REDO]: (state, history) => {
    state.undo = _.assign({}, state.undo, getCursorPosition(state.undo.cursor + 1, history.length - 1));
    _.set(state, 'components', _.cloneDeep(history[state.undo.cursor].components));
    _.set(state, 'page.data', _.cloneDeep(history[state.undo.cursor].pageData));

    return state;
  }
};
