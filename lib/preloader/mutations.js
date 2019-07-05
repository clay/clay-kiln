import _ from 'lodash';
import {
  PRELOAD_PENDING, PRELOAD_SUCCESS, LOADING_SUCCESS, PRELOAD_SITE, PRELOAD_ALL_SITES, PRELOAD_USER, PRELOAD_URL, META_PRESS, META_UNPRESS
} from './mutationTypes';

export default {
  [PRELOAD_PENDING]: state => state,
  [PRELOAD_SUCCESS]: (state, payload) => _.assign(state, payload),
  [LOADING_SUCCESS]: state => _.assign(state, { isLoading: false }),
  [PRELOAD_SITE]: (state, site) => _.assign(state, { site }),
  [PRELOAD_ALL_SITES]: (state, sites) => _.assign(state, { allSites: sites }),
  [PRELOAD_USER]: (state, user) => _.assign(state, { user }),
  [PRELOAD_URL]: (state, urlConfig) => _.assign(state, { url: urlConfig }),
  [META_PRESS]: (state) => {
    state.ui.metaKey = true;

    return state;
  },
  [META_UNPRESS]: (state) => {
    state.ui.metaKey = false;

    return state;
  }
};
