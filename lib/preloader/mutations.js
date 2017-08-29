import _ from 'lodash';
import { PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS, PRELOAD_SITE, PRELOAD_ALL_SITES, PRELOAD_USER, META_PRESS, META_UNPRESS } from './mutationTypes';

export default {
  [PRELOAD_PENDING]: (state) => _.assign(state, { isLoading: true }),
  [PRELOAD_SUCCESS]: (state, payload) => _.assign(state, payload, { isLoading: false }),
  [LOADING_SUCCESS]: (state) => _.assign(state, { isLoading: false }),
  [PRELOAD_SITE]: (state, site) => _.assign(state, { site }),
  [PRELOAD_ALL_SITES]: (state, sites) => _.assign(state, { allSites: sites }),
  [PRELOAD_USER]: (state, user) => _.assign(state, { user }),
  [META_PRESS]: (state) => {
    state.ui.metaKey = true;
    return state;
  },
  [META_UNPRESS]: (state) => {
    state.ui.metaKey = false;
    return state;
  }
};
