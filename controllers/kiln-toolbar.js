const dom = require('@nymag/dom'),
  edit = require('../services/edit'),
  events = require('../services/events'),
  focus = require('../decorators/focus'),
  pane = require('../services/pane'),
  site = require('../services/site'),
  state = require('../services/page-state'),
  progress = require('../services/progress'),
  rules = require('../validators'),
  validation = require('../services/publish-validation');

let EditorToolbar;

/**
 * Open the new page pane
 * note: if there's only one possible page, it'll just create it instead
 * @returns {Promise}
 */
function createPage() {
  return edit.getDataOnly(`${site.get('prefix')}/lists/new-pages`)
    .then(function (pages) {
      // if there are multiple types of pages for a site, open a dialog pane to select the page type
      // otherwise, just create a new page
      // currently 'Press' is the only site that has only one page type
      if (pages.length > 1) {
        return focus.unfocus()
          .then(pane.openNewPage)
          .catch(function () {
            progress.done('error');
            progress.open('error', 'Issue with opening page options.', true);
          });
      } else {
        return edit.createPage(pages[0].id).then(function (url) { // only one page type, so just create a 'new' page
          location.href = url;
        });
      }
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
    '.user-icon click': 'onUserClick',
    '.new click': 'onNewClick',
    '.preview click': 'onPreviewClick',
    '.history click': 'onHistoryClick',
    '.publish click': 'onPublishClick'
  }, this);

  // stop users from leaving the page if they have an unsaved form open!
  window.addEventListener('beforeunload', function (e) {
    if (focus.hasCurrentFocus()) {
      e.returnValue = 'Are you sure you want to leave this page? Your data may not be saved.';
    }
  });

  // close ANY open forms if user hits ESC
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 27) {
      focus.unfocus();
      // note: this will work even if there isn't a current form open
      // fun fact: it'll unselect components as well, in case the user has a form closed
      // but a component selected, and they don't want that
    }
  });

  return state.get().then(function (res) {
    if (res.scheduled) {
      state.openDynamicSchedule(res.scheduledAt, res.publishedUrl);
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

  onPreviewClick: function () {
    return focus.unfocus()
      .then(pane.openPreview)
      .catch(function () {
        progress.done('error');
        progress.open('error', 'Data could not be saved. Please review your open form.', true);
      });
  },

  onHistoryClick: function openHistoryPane() {
    // open the history pane if it's not already open (close other panes first)
  },

  // open the publish pane if it's not already open (close other panes first)
  onPublishClick: function () {
    return focus.unfocus()
      .then(function () {
        // validate before opening the publish pane
        return validation.validate(rules).then(function (results) {
          if (results.errors.length) {
            progress.done('error');
            pane.openValidationErrors(results);
          } else {
            pane.openPublish(results.warnings);
          }
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
