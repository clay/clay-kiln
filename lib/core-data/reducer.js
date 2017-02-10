import _ from 'lodash';
import * as types from './actionsTypes';
import { defaultStore } from '../preloader/actions';

export default function topReducer(store, action) {
  // todo: combine children reducers
  switch (action.type) {
    case types.PRELOAD_PENDING:
      return _.assign({}, store, { isLoading: true });
    case types.PRELOAD_FULFILLED:
      return _.assign({}, action.payload, { isLoading: false });
    default:
      return defaultStore;
  }
}
