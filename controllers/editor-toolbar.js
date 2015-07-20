/*
 idea: autosave happens on a per-component basis
 idea: for now, forms will have explicit save buttons
 question: if I PUT to /component/name/instances/id, is that idempotent? (yes)
 question: should we allow PATCH to /component/name/instances/id with partial data?
 */

var EditorToolbar,
  dom = require('../services/dom'),
  db = require('../services/db'),
  references = require('../services/references'),
  forms = require('../services/forms'),
  edit = require('../services/edit'),
  events = require('../services/events');

/**
 * Publish current page.
 */
function publish() {
  edit.publishPage()
    .then(console.log)
    .catch(console.error);
}

/**
 * Create a new page with the same layout as the current page.
 * @param {string} layoutName
 */
function createPage(layoutName) {
  // todo: allow users to choose their layout / components

  var articlePage = {
    layout: '/components/' + layoutName + '/instances/article',
    main: '/components/story'
  };

  db.postToReference('/pages', articlePage).then(function (res) {
    location.href = res[references.referenceProperty] + '.html?edit=true';
  }).catch(console.error);
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
  this.main = dom.find('.main .primary [' + references.componentAttribute + ']');
  this.el = el;

  events.add(el, {
    '.close click': 'onClose',
    '.new click': 'onNewPage',
    '.settings click': 'onEditSettings',
    '.publish click': 'onPublish'
  }, this);
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
  onNewPage: function () {
    var layoutName = dom.find('[data-layout]').getAttribute('data-layout');

    createPage(layoutName);
  },

  /**
   * On edit settings button
   */
  onEditSettings: function () {
    var primaryComponent = dom.find('.main .primary [' + references.referenceAttribute + ']'),
      ref = primaryComponent.getAttribute(references.referenceAttribute);

    forms.open(ref, document.body);
  },

  /**
   * On publish button
   */
  onPublish: function () {
    publish();
  }
};

module.exports = EditorToolbar;
