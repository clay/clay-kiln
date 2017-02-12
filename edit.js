import Vue from 'vue';
import store from './lib/core-data/store';
import toolbar from './lib/toolbar/view';

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// kick off loading when DOM is ready
// note: preloaded data, external behaviors, decorators, and validation rules should already be added
// when this event fires
document.addEventListener('DOMContentLoaded', function () {
  let toolbarView = new Vue(toolbar);

  store.dispatch('preload');
});
