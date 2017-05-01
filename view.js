import _ from 'lodash';
import { basename, extname } from 'path';
import keycode from 'keycode';
import Vue from 'vue';
import { pageUri } from '@nymag/dom';
import addClayListeners from './lib/utils/shift-clay';
import { add as addPane } from './lib/forms/panes';
import store from './lib/core-data/store';
import toolbar from './lib/toolbar/view-toolbar.vue';
import getPageState from './lib/page-state';
import getSites from './lib/preloader/sites';
import { PRELOAD_PENDING, LOADING_SUCCESS, PRELOAD_SITE, PRELOAD_ALL_SITES } from './lib/preloader/mutationTypes';
import { UPDATE_PAGESTATE, UPDATE_PAGEURI } from './lib/page-state/mutationTypes';
import { CLOSE_PANE } from './lib/panes/mutationTypes';
import { props } from './lib/utils/promises';
import conditionalFocus from './directives/conditional-focus';
import hScrollDirective from './directives/horizontal-scroll';

const paneReq = require.context('./panes', false, /\.vue$/);

// register directives
Vue.directive('conditional-focus', conditionalFocus());
Vue.directive('h-scroll', hScrollDirective());

// Add panes
paneReq.keys().forEach(function (key) {
  addPane(basename(key, extname(key)), paneReq(key));
});

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

addClayListeners();

store.commit(PRELOAD_PENDING);

// kick off loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  store.commit(PRELOAD_SITE, window.kiln.preloadSite);

  new Vue({
    strict: true,
    el: '#kiln-app',
    render(h) {
      return h('view-toolbar');
    },
    store,
    components: {
      'view-toolbar': toolbar
    }
  });

  // don't preload all the data, just grab the page state and site info
  props({
    pageState: getPageState(pageUri()),
    allSites: getSites(window.kiln.preloadSite)
  }).then(({ pageState, allSites }) => {
    store.commit(UPDATE_PAGESTATE, pageState);
    store.commit(UPDATE_PAGEURI, pageUri());
    store.commit(PRELOAD_ALL_SITES, allSites);
    store.commit(LOADING_SUCCESS);
  });

  // when clicks bubble up to the document, close the current pane
  document.body.addEventListener('click', () => {
    // Close a pane
    if (_.get(store, 'state.ui.currentPane')) {
      store.commit(CLOSE_PANE, null);
    }
  });

  // when ESC bubbles up to the document, close the current form or pane / unselect components
  document.body.addEventListener('keydown', (e) => {
    const key = keycode(e);

    if (key === 'esc') {
      if (_.get(store, 'state.ui.currentPane')) {
        store.commit(CLOSE_PANE, null);
      }
    }
  });
});
