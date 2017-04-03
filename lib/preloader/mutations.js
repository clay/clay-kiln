import { assign } from 'lodash';
import { PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS, PRELOAD_SITE } from './mutationTypes';

export default {
  [PRELOAD_PENDING]: (state) => assign(state, { isLoading: true }),
  [PRELOAD_SUCCESS]: (state, payload) => assign(state, payload, { isLoading: false }),
  [LOADING_SUCCESS]: (state) => assign(state, { isLoading: false }),
  [PRELOAD_SITE]: (state, site) => assign(state, { site })
};
