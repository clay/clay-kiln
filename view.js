import keycode from 'keycode';
import Vue from 'vue';
import { pageUri } from '@nymag/dom';
import NProgress from 'vue-nprogress';
import addClayListeners from './lib/utils/shift-clay';
import { addToolbarButton } from './lib/utils/custom-buttons'; // eslint-disable-line
import store from './lib/core-data/store';
import toolbar from './lib/toolbar/view-toolbar.vue';
import getSites from './lib/preloader/sites';
import parseUrl from './lib/preloader/parse-url';
import {
  PRELOAD_PENDING, LOADING_SUCCESS, PRELOAD_SITE, PRELOAD_ALL_SITES, PRELOAD_USER, PRELOAD_URL
} from './lib/preloader/mutationTypes';
import { UPDATE_PAGE_STATE, UPDATE_PAGEURI } from './lib/page-state/mutationTypes';
import { META_PRESS, META_UNPRESS } from './lib/preloader/mutationTypes';
import { props } from './lib/utils/promises';
import { getItem } from './lib/utils/local';
import conditionalFocus from './directives/conditional-focus';
import 'keen-ui/src/bootstrap'; // import this once, for KeenUI components

const progressOptions = {
    parent: '.nprogress-container',
    template: '<div class="bar" role="bar"></div>',
    showSpinner: false,
    easing: 'linear',
    speed: 500,
    trickle: false,
    minimum: 0.001
  },
  nprogress = new NProgress(progressOptions);

// register directives
Vue.directive('conditional-focus', conditionalFocus());

// add progress bar
Vue.use(NProgress, {
  router: false,
  http: false
});

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

addClayListeners();

store.commit(PRELOAD_PENDING);

// kick off loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  store.commit(PRELOAD_SITE, window.kiln.preloadSite);

  new Vue({
    debug: process.env.NODE_ENV !== 'production',
    strict: true,
    el: '#kiln-app',
    render(h) {
      return h('view-toolbar');
    },
    store,
    nprogress,
    components: {
      'view-toolbar': toolbar
    }
  });

  // don't preload all the data, just grab the page state, site info, and user
  props({
    pageState: store.dispatch('getListData', { uri: pageUri(), prefix: window.kiln.preloadSite.prefix }),
    allSites: getSites(window.kiln.preloadSite),
    lists: store.dispatch('getList', 'new-pages'),
    favoritePageCategory: getItem('kiln-page-category')
  }).then(({ pageState, allSites, favoritePageCategory }) => {
    store.commit(UPDATE_PAGE_STATE, pageState);
    store.commit(UPDATE_PAGEURI, pageUri());
    store.commit(PRELOAD_ALL_SITES, allSites);
    store.commit(PRELOAD_USER, window.kiln.preloadUser);
    store.commit(PRELOAD_URL, parseUrl());
    store.commit(LOADING_SUCCESS);
    // if the user has a favorite new page category set,
    // make sure it'll be in the state when they open that list
    if (favoritePageCategory) {
      store.commit('CHANGE_FAVORITE_PAGE_CATEGORY', favoritePageCategory);
    }
  }).then(() => store.dispatch('parseURLHash')); // check for deep-linked clay menu

  // when ESC bubbles up to the document, close the current form or pane / unselect components
  document.body.addEventListener('keydown', (e) => {
    const key = keycode(e);

    if (key === 'ctrl' || key === 'left command') {
      // pressing and holding meta key will unlock additional functionality,
      // such as the ability to duplicate the selected component
      store.commit(META_PRESS);
    }
  });

  // when user stops pressing a key, toggle this off
  document.body.addEventListener('keyup', (e) => {
    const key = keycode(e);

    if (key === 'ctrl' || key === 'left command') {
      store.commit(META_UNPRESS);
    }
  });

  // when user tabs / clicks away from the page, toggle this off
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      store.commit(META_UNPRESS);
    }
  });
});
