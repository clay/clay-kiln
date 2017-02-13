import Vue from 'vue';
import { pageUri } from '@nymag/dom';
import addClayListeners from './lib/utils/shift-clay';
import store from './lib/core-data/store';
import toolbar from './lib/toolbar/view-toolbar.vue';
import getPageState from './lib/page/page-state';
import { PRELOAD_PENDING, LOADING_SUCCESS } from './lib/preloader/mutationTypes';
import { UPDATE_PAGESTATE, UPDATE_PAGEURI } from './lib/page/mutationTypes';

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

addClayListeners();

store.commit(PRELOAD_PENDING);

// kick off loading when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  new Vue({
    strict: true,
    el: '#kiln-app',
    store,
    components: {
      'view-toolbar': toolbar
    }
  });

  getPageState(pageUri()).then(function (pageState) {
    store.commit(UPDATE_PAGESTATE, pageState);
    store.commit(UPDATE_PAGEURI, pageUri());
    store.commit(LOADING_SUCCESS);
  });
});
