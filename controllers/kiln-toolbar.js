/*
 idea: autosave happens on a per-component basis
 idea: for now, forms will have explicit save buttons
 question: if I PUT to /component/name/instances/id, is that idempotent? (yes)
 question: should we allow PATCH to /component/name/instances/id with partial data?
 */

var EditorToolbar,
  _ = require('lodash'),
  dom = require('../services/dom'),
  references = require('../services/references'),
  forms = require('../services/forms'),
  edit = require('../services/edit'),
  validation = require('../services/publish-validation'),
  rules = require('../publishing-rules'),
  ValidationDropdown = require('./validation-dropdown'),
  focus = require('../decorators/focus'),
  events = require('../services/events');

/**
 * Publish current page.
 * @param {Element} el
 * @returns {Promise}
 */
function publish(el) {
  return validation.validate(rules).then(function (errors) {
    if (errors.length === 0) {
      return edit.publishPage().then(function () {
        console.log('published', arguments);
      }).catch(function (error) {
        console.error('publish error', error);
      });
    } else {
      console.error('validation errors', errors);
      return new ValidationDropdown(el, errors);
    }
  });
}

/**
 * Create a new page with the same layout as the current page.
 * currently, this just clones the current page
 * (cloning special "new" instances of the page-specific components)
 * e.g. /components/article/instances/new
 * @returns {Promise}
 */
function createPage() {
  // todo: allow users to choose their layout / components

  return edit.createPage();
}

/**
 * Remove querystring from current location
 */
function removeQuerystring() {
  location.href = location.href.split('?').shift();
}

/**
 * @class EditorToolbar
 * @param {Element} el
 * @property {Element} el
 */
EditorToolbar = function (el) {

  // grab the first component in the primary area
  this.main = dom.find('.main .primary [' + references.referenceAttribute + ']');
  this.el = el;

  events.add(el, {
    '.close click': 'onClose',
    '.new click': 'onNewPage',
    '.settings click': 'onEditSettings',
    '.publish click': 'onPublish'
  }, this);

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
  /**
   * On close button
   */
  onClose: function () {
    removeQuerystring();
  },

  /**
   * On new page button
   */
  onNewPage: createPage,

  /**
   * On edit settings button
   */
  onEditSettings: function () {
    var primaryComponent = this.main,
      ref = primaryComponent.getAttribute(references.referenceAttribute);

    forms.open(ref, document.body);
  },

  /**
   * On publish button
   */
  onPublish: function () {
    var el = this.el;

    publish(el);
  }
};

module.exports = EditorToolbar;
