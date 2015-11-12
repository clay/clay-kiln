var EditorToolbar,
  dom = require('../services/dom'),
  edit = require('../services/edit'),
  events = require('../services/events'),
  rules = require('../validators'),
  validation = require('../services/publish-validation');

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

  onNewClick: createPage, // right now, just create a new page

  onHistoryClick: function openHistoryPane() {
    // open the history pane if it's not already open (close other panes first)
  },

  onPublishClick: function openPublishPane() {
    // open the publish pane if it's not already open (close other panes first)
    // todo: add publish pane. right now it's just publishing instantly
    return validation.validate(rules).then(function (errors) {
      if (errors.length) {
        alert('there are errors');
      } else {
        return edit.publishPage().then(function () {
          alert('published!');
        });
      }
    })
  }
};

module.exports = EditorToolbar;
