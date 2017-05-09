import { basename, extname } from 'path';
import _ from 'lodash';
import Vue from 'vue';
import NProgress from 'vue-nprogress';
import keycode from 'keycode';
import store from './lib/core-data/store';
import { decorateAll } from './lib/decorators';
import { addSelectorButton } from './lib/utils/custom-buttons'; // eslint-disable-line
import { add as addBehavior } from './lib/forms/behaviors';
import { add as addPane } from './lib/forms/panes';
import toolbar from './lib/toolbar/edit-toolbar.vue';
import { HIDE_STATUS } from './lib/toolbar/mutationTypes';
import { init as initValidators } from './lib/validators';
import conditionalFocus from './directives/conditional-focus';
import hScrollDirective from './directives/horizontal-scroll';
import utilsAPI from './lib/utils/api';
import { hasClickedFocusableEl } from './lib/decorators/focus';

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

// init validators
initValidators();

// add progress bar
Vue.use(NProgress, {
  router: false,
  http: false
});

// Register keys to make key events easy to call
Vue.config.keyCodes.comma = 188;

// register directives
Vue.directive('conditional-focus', conditionalFocus());
Vue.directive('h-scroll', hScrollDirective());

// export api for plugins, validators, behaviors, buttons, etc
window.kiln = window.kiln || {};
// .plugins, .behaviors, .validators, and .panes objects should already exist
window.kiln.utils = utilsAPI;

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

  // add external plugins
  _.forOwn(window.kiln.plugins || {}, (plugin) => plugin(store));

  store.dispatch('preload')
    .then(() => decorateAll())
    .then(() => store.dispatch('openHashedForm'))
    .then(() => {
      // test connection loss on page load
      if (!navigator.onLine) {
        store.dispatch('showStatus', { type: 'offline', message: connectionLostMessage, isPermanent: true});
      }
    });

  // when clicks bubble up to the document, close the current form or pane / unselect components
  document.body.addEventListener('click', (e) => {
    // unselect if clicking out of the current selection (if user isn't trying to select text)
    // todo: handle panes where we want to stay selected
    if (_.get(store, 'state.ui.currentSelection') && !window.kiln.isInvalidDrag) {
      // note: stopSelection is set in the 'select' action. see the comments there for details
      store.dispatch('unselect');
    }

    // always unfocus if clicking out of the current focus (and not directly clicking into another focusable el)
    if (_.get(store, 'state.ui.currentFocus') && !hasClickedFocusableEl(e) && !window.kiln.isInvalidDrag) {
      store.dispatch('unfocus').catch(_.noop);
    }

    // unset isInvalidDrag after checking for unfocus / unselect
    window.kiln.isInvalidDrag = false;

    // Close a pane
    if (_.get(store, 'state.ui.currentPane')) {
      store.commit(CLOSE_PANE, null);
    }
  });

  // when ESC bubbles up to the document, close the current form or pane / unselect components
  document.body.addEventListener('keydown', (e) => {
    const key = keycode(e);

    if (key === 'esc') {
      if (_.get(store, 'state.ui.currentSelection')) {
        store.dispatch('unselect');
      }

      if (_.get(store, 'state.ui.currentFocus')) {
        store.dispatch('unfocus').catch(_.noop);
      }

      if (_.get(store, 'state.ui.currentPane')) {
        store.commit(CLOSE_PANE, null);
      }
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
  // undo and redo with shortkey+z / shift+shortkey+z
  // display cheat sheet of all keyboard shortcuts with shift+?
  document.addEventListener('keydown', function (e) {
    const key = keycode(e),
      // shortKey is a Quill convention to test for cmd on mac and ctrl on windows
      SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

    // don't navigate if they have a form or pane open
    if (_.get(store, 'state.ui.currentFocus') || _.get(store, 'state.ui.currentPane')) {
      return;
    }

    if (key === 'up') {
      store.dispatch('navigateComponents', 'prev');
    } else if (key === 'down') {
      store.dispatch('navigateComponents', 'next');
    } else if (key === 'z' && e[SHORTKEY] && e.shiftKey) {
      // redo
      store.dispatch('redo');
    } else if (key === 'z' && e[SHORTKEY]) {
      // undo
      store.dispatch('undo');
    } else if (key === '/' && e.shiftKey === true) {
      // cheat sheet
      store.dispatch('openPane', {
        title: 'Keyboard Shortcuts',
        position: 'center',
        size: 'large',
        content: {
          component: 'keyboard-shortcuts'
        }
      });
    }
  });
});
