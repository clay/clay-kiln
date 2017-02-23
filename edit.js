import { basename, extname } from 'path';
import _ from 'lodash';
import Vue from 'vue';
import store from './lib/core-data/store';
import { decorateAll } from './lib/decorators';
import { add as addBehavior } from './lib/forms/behaviors';
import { add as addPane } from './lib/forms/panes';
import toolbar from './lib/toolbar/edit-toolbar.vue';

// TODO: Figure out saving/closing and reverting in panes
import { CLOSE_PANE } from './lib/panes/mutationTypes';

const behaviorReq = require.context('./behaviors', false, /\.vue$/),
  paneReq = require.context('./panes', false, /\.vue$/);

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// Add behaviors
behaviorReq.keys().forEach(function (key) {
  addBehavior(basename(key, extname(key)), behaviorReq(key));
});

// Add panes
paneReq.keys().forEach(function (key) {
  addPane(basename(key, extname(key)), paneReq(key));
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
    // always unselect if clicking out of the current selection
    // todo: handle panes where we want to stay selected
    if (_.get(store, 'state.ui.currentSelection') && !e.stopSelection) {
      // note: stopSelection is set in the 'select' action. see the comments there for details
      store.dispatch('unselect');
    }

    // always unfocus if clicking out of the current focus
    if (_.get(store, 'state.ui.currentFocus') && !e.stopFocus) {
      store.dispatch('unfocus');
    }

    // Close a pane
    if (_.get(store, 'state.ui.currentPane')) {
      store.commit(CLOSE_PANE, null);
    }
  });
});
