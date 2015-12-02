var EditorToolbar,
  dom = require('../services/dom'),
  edit = require('../services/edit'),
  events = require('../services/events'),
  focus = require('../decorators/focus'),
  pane = require('../services/pane'),
  state = require('../services/page-state'),
  progress = require('../services/progress');

/**
 * Create a new page with the same layout as the current page.
 * currently, this just clones the `new` page
 * (cloning special "new" instances of the page-specific components)
 * e.g. /components/article/instances/new
 * @returns {Promise}
 */
function createPage() {
  // todo: allow users to choose their layout / components

  return edit.createPage().then(function (url) {
    location.href = url;
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
  this.el = el;

  events.add(el, {
    '.user-icon click': 'onUserClick',
    '.new click': 'onNewClick',
    '.history click': 'onHistoryClick',
    '.publish click': 'onPublishClick'
  }, this);

  // stop users from leaving the page if they have an unsaved form open!
  window.addEventListener('beforeunload', function (e) {
    if (focus.hasCurrentFocus()) {
      e.returnValue = 'Are you sure you want to leave this page? Your data may not be saved.';
    }
  });

  return state.get().then(function (res) {
    if (res.scheduled) {
      state.toggleScheduled(true);
      progress.open('schedule', `Page will be published ${state.formatTime(res.scheduledAt, true)}`);
    } else if (res.published) {
      progress.open('publish', `Page is currently live: <a href="${res.publishedUrl}" target="_blank">View Page</a>`);
    }
  });
};

/**
 * @lends EditorToolbar#
 */
EditorToolbar.prototype = {
  onUserClick: function (e) {
    // nothing yet
    e.preventDefault();
    e.stopPropagation();
  },

  onNewClick: function () {
    if (focus.hasCurrentFocus()) {
      if(window.confirm('Are you sure you want to create a new page? Your data on this page may not be saved.')) { // eslint-disable-line
        return createPage();
      } // else don't leave
    } else {
      return createPage();
    }
  },

  onHistoryClick: function openHistoryPane() {
    // open the history pane if it's not already open (close other panes first)
  },

  // open the publish pane if it's not already open (close other panes first)
  onPublishClick: pane.openPublish
};

module.exports = EditorToolbar;
