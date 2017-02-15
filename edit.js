import { basename, extname } from 'path';
import _ from 'lodash';
import Vue from 'vue';
import store from './lib/core-data/store';
import { decorateAll } from './lib/decorators';
import { add as addBehavior } from './lib/forms/behaviors';
import toolbar from './lib/toolbar/edit-toolbar.vue';

const behaviorReq = require.context('./behaviors', false, /\.vue$/);

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// add behaviors
behaviorReq.keys().forEach(function (key) {
  addBehavior(basename(key, extname(key)), behaviorReq(key));
});

// kick off loading when DOM is ready
// note: preloaded data, external behaviors, decorators, and validation rules should already be added
// when this event fires
document.addEventListener('DOMContentLoaded', function () {
  new Vue({
    strict: true,
    el: '#kiln-app',
    render(h) {
      return h('edit-toolbar');
    },
    store,
    components: {
      'edit-toolbar': toolbar
    }
  });

  store.dispatch('preload').then(() => decorateAll());

  // when clicks bubble up to the document, close the current form or pane / unselect components
  document.body.addEventListener('click', (e) => {
    e.stopPropagation();

    // always unselect if clicking out of the current selection
    // todo: handle panes where we want to stay selected
    if (_.get(store, 'state.ui.currentSelection')) {
      store.dispatch('unselect');
    }

    // always unfocus if clicking out of the current focus
    // todo: handle overlay/settings forms so they don't unfocus
    if (_.get(store, 'state.ui.currentFocus')) {
      store.dispatch('unfocus');
    }
  });
});
