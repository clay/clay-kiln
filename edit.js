import { basename, extname } from 'path';
import _ from 'lodash';
import Vue from 'vue';
import NProgress from 'vue-nprogress';
import keycode from 'keycode';
import store from './lib/core-data/store';
import { decorateAll } from './lib/decorators';
import { add as addBehavior } from './lib/forms/behaviors';
import { add as addPane } from './lib/forms/panes';
import toolbar from './lib/toolbar/edit-toolbar.vue';
import { HIDE_STATUS } from './lib/toolbar/mutationTypes';

// TODO: Figure out saving/closing and reverting in panes
import { CLOSE_PANE } from './lib/panes/mutationTypes';

const behaviorReq = require.context('./behaviors', false, /\.vue$/),
  paneReq = require.context('./panes', false, /\.vue$/),
  // todo: in the future, we should queue up the saves
  connectionLostMessage = 'Connection Lost. Changes will <strong>NOT</strong> be saved.',
  progressOptions = {
    parent: '.nprogress-container',
    template: '<div class="bar" role="bar"></div>',
    showSpinner: false,
    easing: 'linear',
    speed: 500,
    trickle: false,
    minimum: 0.001
  },
  nprogress = new NProgress(progressOptions);

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

// add progress bar
Vue.use(NProgress, {
  router: false,
  http: false
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
    nprogress,
    components: {
      'edit-toolbar': toolbar
    }
  });

  store.dispatch('preload')
    .then(() => decorateAll())
    .then(() => {
      // test connection loss on page load
      if (!navigator.onLine) {
        store.dispatch('showStatus', { type: 'offline', message: connectionLostMessage, isPermanent: true});
      }
    });

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

  window.addEventListener('online', function () {
    store.commit(HIDE_STATUS); // in case there are any status messages open, close them
  });

  window.addEventListener('offline', function () {
    // todo: turn any progress indicators to grey and end them
    store.dispatch('showStatus', { type: 'offline', message: connectionLostMessage, isPermanent: true});
  });

  // navigate components when hitting ↑ / ↓ arrows (if there's a component selected)
  document.addEventListener('keydown', function (e) {
    const key = keycode(e);

    // don't navigate if they have a form open
    if (_.get(store, 'state.ui.currentFocus')) {
      return;
    }

    if (key === 'up') {
      store.dispatch('navigateComponents', 'prev');
    } else if (key === 'down') {
      store.dispatch('navigateComponents', 'next');
    }
  });
});
