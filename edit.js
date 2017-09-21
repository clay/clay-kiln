import { basename, extname } from 'path';
import _ from 'lodash';
import Vue from 'vue';
import NProgress from 'vue-nprogress';
import keycode from 'keycode';
import differenceInMinutes from 'date-fns/difference_in_minutes';
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
import { hasClickedSelectableEl } from './lib/decorators/select';
import { META_PRESS, META_UNPRESS } from './lib/preloader/mutationTypes';
import 'keen-ui/src/bootstrap'; // import this once, for KeenUI components

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

/**
 * get the last user who edited a page, who ISN'T the current user
 * @param  {object} store
 * @return {null|string}
 */
function getLastEditUser(store) {
  const currentUser = _.get(store, 'state.user'),
    lastUser = _.findLast(_.get(store, 'state.page.state.users'), (user) => {
      const isDifferentUser = user.username !== currentUser.username,
        isWithinFiveMinutes = Math.abs(differenceInMinutes(user.updateTime, new Date())) < 5;

      return isDifferentUser && isWithinFiveMinutes;
    });

  return lastUser ? lastUser.name : null;
}

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

  // page load indicator. will be finished by the preloader
  store.dispatch('startProgress', 'offline');

  // add external plugins
  _.forOwn(window.kiln.plugins || {}, (plugin) => plugin(store));

  store.dispatch('preload')
    .then(() => decorateAll())
    .then(() => store.dispatch('openHashedForm'))
    .then(() => store.dispatch('getList', 'new-pages'))
    .then(() => {
      const pageTemplates = _.get(store, 'state.lists[new-pages].items'),
        currentPageURI = _.get(store, 'state.page.uri'),
        currentPageID = currentPageURI.match(/pages\/([A-Za-z0-9\-]+)/)[1],
        currentPageTemplate = _.find(pageTemplates, (template) => template.id === currentPageID);

      if (!navigator.onLine) {
        // test connection loss on page load
        store.dispatch('showStatus', { type: 'offline', message: connectionLostMessage, isPermanent: true});
      } else if (getLastEditUser(store)) {
        // show message if another user has edited this page in the last 5 minutes
        store.dispatch('showStatus', { type: 'save', message: `Edited less than 5 minutes ago by ${getLastEditUser(store)}` });
      }

      // display a status message if you're editing a page template
      if (currentPageTemplate) {
        store.dispatch('showStatus', { type: 'warning', message: `You are currently editing the "${currentPageTemplate.title}" template. Changes you make will be reflected on new pages that use this template.`, isPermanent: true, dismissable: true });
      }
    });

  // when clicks bubble up to the document, close the current form or pane / unselect components
  document.body.addEventListener('click', (e) => {
    if (_.get(store, 'state.ui.currentFocus') && !hasClickedFocusableEl(e) && !window.kiln.isInvalidDrag) {
      // always unfocus if clicking out of the current focus (and not directly clicking into another focusable el)
      // note: isInvalidDrag is set when dragging to select text in a text/wysiwyg field,u
      // since if you drag outside the form it'll trigger a click. ♥ browsers ♥
      store.dispatch('unfocus').catch(_.noop);
    } else if (_.get(store, 'state.ui.currentSelection') && !hasClickedSelectableEl(e) && !window.kiln.isInvalidDrag) {
      // unselect if clicking out of the current selection (if user isn't trying to select text)
      // note: stopSelection is set in the 'select' action. see the comments there for details
      store.dispatch('unselect');
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
      // pressing esc when forms are focused unfocuses them but does NOT unselect the component.
      // press esc again to unselect a component
      if (_.get(store, 'state.ui.currentFocus')) {
        store.dispatch('unfocus').catch(_.noop);
      } else if (_.get(store, 'state.ui.currentSelection')) {
        store.dispatch('unselect');
      }

      if (_.get(store, 'state.ui.currentPane')) {
        store.commit(CLOSE_PANE, null);
      }
    } else if (key === 'ctrl' || key === 'left command') {
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
  document.addEventListener('keydown', function (e) { // eslint-disable-line
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
        height: 'medium-height',
        content: {
          component: 'keyboard-shortcuts'
        }
      });
    }
  });
});
