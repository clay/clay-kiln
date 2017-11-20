import { basename, extname } from 'path';
import _ from 'lodash';
import Vue from 'vue';
import NProgress from 'vue-nprogress';
import keycode from 'keycode';
import velocity from 'velocity-animate/velocity.min.js';
import differenceInMinutes from 'date-fns/difference_in_minutes';
import store from './lib/core-data/store';
import { addSelectorButton } from './lib/utils/custom-buttons'; // eslint-disable-line
import { add as addInput } from './lib/forms/inputs';
import { init as initValidators } from './lib/validators';
import conditionalFocus from './directives/conditional-focus';
import utilsAPI from './lib/utils/api';
import { hasClickedFocusableEl } from './lib/decorators/focus';
import { hasClickedSelectableEl } from './lib/decorators/select';
import { META_PRESS, META_UNPRESS } from './lib/preloader/mutationTypes';
import { getEventPath } from './lib/utils/events';
import { standardCurve } from './lib/utils/references';
import 'keen-ui/src/bootstrap'; // import this once, for KeenUI components
import 'velocity-animate/velocity.ui.min.js'; // import this once, for velocity ui stuff

// set animation defaults
velocity.defaults.easing = standardCurve;
velocity.defaults.queue = false;

const inputReq = require.context('./inputs', false, /\.vue$/),
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

// Add inputs
inputReq.keys().forEach(function (key) {
  addInput(basename(key, extname(key)), inputReq(key));
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

// export api for plugins, validators, inputs, buttons, etc
window.kiln = window.kiln || {};
// .plugins, .inputs, .validators, and .panes objects should already exist
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
// note: preloaded data, external inputs, decorators, and validation rules should already be added
// when this event fires
document.addEventListener('DOMContentLoaded', function () {
  const toolbar = require('./lib/toolbar/edit-toolbar.vue');
  // instantiate toolbar on DOMContentLoaded, so custom buttons and modals can be
  // added as child components to the toolbar and simple-modal

  Vue.component('edit-toolbar', toolbar);

  new Vue({
    debug: process.env.NODE_ENV !== 'production',
    strict: true,
    el: '#kiln-app',
    render(h) {
      return h('edit-toolbar');
    },
    store,
    nprogress
  });

  // page load indicator. will be finished by the preloader
  store.dispatch('startProgress', 'offline');

  // add external plugins
  _.forOwn(window.kiln.plugins || {}, (plugin) => plugin(store));

  // add `kiln-edit-mode` class to body. this allows certain components
  // (e.g. embeds that rely on client-side js, which doesn't run in edit mode)
  // to add special edit-mode-only styling
  document.body.classList.add('kiln-edit-mode');

  store.dispatch('preload')
    .then(() => require('./lib/decorators').decorateAll())
    .then(() => store.dispatch('openHashedForm'))
    .then(() => store.dispatch('getList', 'new-pages'))
    .then(() => {
      const pageTemplates = _.get(store, 'state.lists[new-pages].items'),
        currentPageURI = _.get(store, 'state.page.uri'),
        currentPageID = currentPageURI.match(/pages\/([A-Za-z0-9\-]+)/)[1],
        currentPageTemplate = _.find(pageTemplates, (template) => template.id === currentPageID);

      if (!navigator.onLine) {
        // test connection loss on page load
        store.dispatch('addAlert', { type: 'error', text: connectionLostMessage, permanent: true });
      } else if (getLastEditUser(store)) {
        // show message if another user has edited this page in the last 5 minutes
        store.dispatch('addAlert', { type: 'info', text: `Edited less than 5 minutes ago by ${getLastEditUser(store)}` });
      }

      // display a status message if you're editing a page template
      if (currentPageTemplate) {
        store.dispatch('addAlert', { type: 'warning', text: `You are currently editing the "${currentPageTemplate.title}" template. Changes you make will be reflected on new pages that use this template.` });
      }
    });

  // when clicks bubble up to the document, close the current form or pane / unselect components
  document.body.addEventListener('click', (e) => {
    if (_.find(getEventPath(e), (el) => el.classList && el.classList.contains('ui-calendar'))) {
      return;
    }

    if (_.get(store, 'state.ui.currentFocus') && !hasClickedFocusableEl(e) && !window.kiln.isInvalidDrag) {
      // always unfocus if clicking out of the current focus (and not directly clicking into another focusable el)
      // note: isInvalidDrag is set when dragging to select text in a text/wysiwyg field,u
      // since if you drag outside the form it'll trigger a click. ♥ browsers ♥
      store.dispatch('unfocus').catch(_.noop);
    } else if (_.get(store, 'state.ui.currentAddComponentModal')) {
      store.dispatch('closeAddComponent');
    } else if (_.get(store, 'state.ui.currentSelection') && !hasClickedSelectableEl(e) && !window.kiln.isInvalidDrag) {
      // unselect if clicking out of the current selection (if user isn't trying to select text)
      // note: stopSelection is set in the 'select' action. see the comments there for details
      store.dispatch('unselect');
    }

    // unset isInvalidDrag after checking for unfocus / unselect
    window.kiln.isInvalidDrag = false;
  });

  // when ESC bubbles up to the document, close the current form or pane / unselect components
  document.body.addEventListener('keydown', (e) => {
    const key = keycode(e);

    if (key === 'esc') {
      // pressing esc when forms are focused unfocuses them but does NOT unselect the component.
      // press esc again to unselect a component
      if (_.get(store, 'state.ui.currentFocus')) {
        store.dispatch('unfocus').catch(_.noop);
      } else if (_.get(store, 'state.ui.currentAddComponentModal')) {
        store.dispatch('closeAddComponent');
      } else if (_.get(store, 'state.ui.currentSelection')) {
        store.dispatch('unselect');
      }
    } else if (key === 'ctrl' || key === 'left command') {
      // pressing and holding meta key will unlock additional functionality,
      // such as the ability to duplicate the selected component
      store.commit(META_PRESS);
    }
  });

  document.body.addEventListener('mousemove', _.debounce((e) => {
    if (_.get(store, 'state.ui.metaKey') && !e.ctrlKey && !e.metaKey) {
      store.commit(META_UNPRESS);
    }
  }), 100);

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
    store.dispatch('removeAlert', { type: 'error', text: connectionLostMessage, permanent: true });
  });

  window.addEventListener('offline', function () {
    store.dispatch('addAlert', { type: 'error', text: connectionLostMessage, permanent: true });
  });

  // navigate components when hitting ↑ / ↓ arrows (if there's a component selected)
  // undo and redo with shortkey+z / shift+shortkey+z
  // display cheat sheet of all keyboard shortcuts with shift+?
  document.addEventListener('keydown', function (e) { // eslint-disable-line
    const key = keycode(e),
      // shortKey is a Quill convention to test for cmd on mac and ctrl on windows
      SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

    // don't navigate if they have a form or pane open
    if (_.get(store, 'state.ui.currentFocus') || _.get(store, 'state.ui.currentPane') || _.get(store, 'state.ui.currentAddComponentModal')) {
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
      store.dispatch('openModal', {
        title: 'Keyboard Shortcuts',
        type: 'keyboard'
      });
    }
  });
});
