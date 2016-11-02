const dom = require('@nymag/dom'),
  events = require('../services/events'),
  state = require('../services/page-state'),
  progress = require('../services/progress'),
  rules = require('../validators'),
  validation = require('../services/publish-validation'),
  openNewPage = require('../services/pane/new-page'),
  openPublish = require('../services/pane/publish'),
  openClayMenu = require('../services/pane/clay-menu'),
  toggleEdit = require('../services/toggle-edit');

let EditorToolbar;

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
    '.new click': 'onNewClick',
    '.edit-button click': 'onEditClick',
    '.publish click': 'onPublishClick'
  }, this);

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

  onNewClick: function () {
    return openNewPage();
  },

  onEditClick: function () {
    return toggleEdit();
  },

  // open the publish pane if it's not already open (close other panes first)
  onPublishClick: function () {
    return validation.validate(rules).then(function (results) {
      if (results.errors.length) {
        progress.done('error');
      }

      openPublish(results);
    });
  }
};

module.exports = EditorToolbar;
