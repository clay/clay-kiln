const dom = require('@nymag/dom'),
  keyCode = require('keycode'),
  events = require('../services/events'),
  forms = require('../services/forms'),
  select = require('../services/components/select'),
  state = require('../services/page-state'),
  progress = require('../services/progress'),
  rules = require('../validators'),
  validation = require('../services/publish-validation'),
  openNewPage = require('../services/pane/new-page'),
  openComponents = require('../services/pane/components'),
  openPreview = require('../services/pane/preview'),
  openPublish = require('../services/pane/publish'),
  openClayMenu = require('../services/pane/clay-menu'),
  pane = require('../services/pane'),
  toggleEdit = require('../services/toggle-edit');

let EditorToolbar;

/**
 * Open the new page pane
 * note: if there's only one possible page, it'll just create it instead
 * @returns {Promise}
 */
function createPage() {
  return forms.close()
    .then(openNewPage)
    .catch(function () {
      progress.done('error');
      progress.open('error', 'Issue with opening page options.', true);
    });
}

/**
 * @class EditorToolbar
 * @param {Element} el
 * @property {Element} el
 */
EditorToolbar = function (el) {
  this.statusEl = dom.find(el, '.kiln-status');
  this.progressEl = dom.find(el, '.kiln-progress');
  this.toolbar = dom.find(el, '.kiln-toolbar');

  events.add(this.toolbar, {
    '.clay-menu-button click': 'onClayMenuClick',
    '.components click': 'onComponentsClick',
    '.new click': 'onNewClick',
    '.preview click': 'onPreviewClick',
    '.view-button click': 'onViewClick',
    '.publish click': 'onPublishClick'
  }, this);

  // stop users from leaving the page if they have an unsaved form open!
  window.addEventListener('beforeunload', function (e) {
    if (forms.hasOpenForm()) {
      e.returnValue = 'Are you sure you want to leave this page? Your data may not be saved.';
    }
  });

  // when the user hits ESC,
  // if a pane is open, close it
  // else if a form is open, close it
  // else if a component is selected, unselect it (don't close form AND unselect)
  document.addEventListener('keydown', function (e) {
    var key = keyCode(e);

    if (key === 'esc') {
      if (pane.hasOpenPane()) {
        pane.close();
      } else if (forms.hasOpenForm()) {
        forms.close();
      } else {
        select.unselect();
      }
    }
  });

  return state.get().then(function (res) {
    // toggle the .draft class on the button so that it'll always be available
    // even if the user unschedules/unpublishes (this prevents a flash of "draft" on already-pubbed/scheduled articles)
    state.toggleButton('draft', true);

    if (res.scheduled) {
      state.openDynamicSchedule(res.scheduledAt, res.publishedUrl);
    } else if (res.published) {
      state.toggleButton('published', true);
      progress.open('publish', `Page is currently published: <a href="${res.publishedUrl}" target="_blank">View Page</a>`);
    }
  });
};

/**
 * @lends EditorToolbar#
 */
EditorToolbar.prototype = {
  onClayMenuClick: function () {
    return openClayMenu();
  },

  onComponentsClick: function () {
    // note: we're explicitly NOT closing any current forms,
    // because we don't want to unselect a currently selected component
    return openComponents();
  },

  onNewClick: function () {
    if (forms.hasOpenForm()) {
      if(window.confirm('Are you sure you want to create a new page? Your data on this page may not be saved.')) { // eslint-disable-line
        return createPage();
      } // else don't leave
    } else {
      return createPage();
    }
  },

  onPreviewClick: function () {
    return forms.close()
      .then(openPreview)
      .catch(function () {
        progress.done('error');
        progress.open('error', 'Data could not be saved. Please review your open form.', true);
      });
  },

  onViewClick: function () {
    return toggleEdit();
  },

  // open the publish pane if it's not already open (close other panes first)
  onPublishClick: function () {
    return forms.close()
      .then(function () {
        // validate before opening the publish pane
        return validation.validate(rules).then(function (results) {
          if (results.errors.length) {
            progress.done('error');
          }

          openPublish(results);
        });
      })
      .catch(function () {
        // if we can't unfocus the current form...
        progress.done('error');
        progress.open('error', 'Data could not be saved. Please review your open form.', true);
      });
  }
};

module.exports = EditorToolbar;
