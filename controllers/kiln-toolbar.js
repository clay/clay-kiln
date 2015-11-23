var EditorToolbar,
  dom = require('../services/dom'),
  edit = require('../services/edit'),
  events = require('../services/events'),
  focus = require('../decorators/focus'),
  pane = require('../services/pane');

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
 * update the publish button depending on the page state
 * @param {object} state
 * @param {boolean} [state.scheduled]
 * @param {boolean} [state.published]
 */
function updatePublishButton(state) {
  var el = dom.find('.kiln-toolbar-inner .publish'),
    classes = el.classList,
    published = 'published',
    scheduled = 'scheduled';

  if (state.scheduled) {
    classes.remove(published);
    classes.add(scheduled);
  } else if (state.published) {
    classes.remove(scheduled);
    classes.add(published);
  } else {
    classes.remove(published);
    classes.remove(scheduled);
  }
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

  // open the publish pane if it's not already open (close other panes first)
  onPublishClick: pane.openPublish
};

module.exports = EditorToolbar;
module.exports.updatePublishButton = updatePublishButton;
