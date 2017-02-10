import _ from 'lodash';
import * as types from './actionsTypes';

export default function topReducer(store, action) {
  // todo: combine children reducers
  switch (action.type) {
    case types.PRELOAD_PENDING:
      return _.assign({}, store, { ui: { inProgress: true }});
    case types.PRELOAD_FULFILLED:
      return _.assign({}, action.payload);
    default:
      return store;
  }
}
