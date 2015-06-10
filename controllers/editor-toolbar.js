'use strict';

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
  formCreator = require('../services/form-creator'),
  edit = require('../services/edit'),
  events = require('../services/events');

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
    '.close click': 'close',
    '.new click': 'newPage',
    '.meta click': 'editMetadata',
    '.publish click': 'publish'
  }, this);
};

/**
 * @lends EditorToolbar#
 */
EditorToolbar.prototype = {
  /**
   * goes back to view mode
   */
  close: function () {
    location.href = location.href.split('?').shift();
  },

  // todo: allow users to choose their layout / components
  newPage: function () {
    var layoutName = dom.find('[data-layout]'),
      articlePage = {
        layout: '/components/' + layoutName + '/instances/article',
        main: '/components/story'
      };

    db.postToReference('/pages', articlePage).then(function (res) {
      location.href = res[references.referenceProperty] + '.html?edit=true';
    });
  },

  /**
   * edit metadata for the main component
   * opens a modal with ???
   */
  editMetadata: function () {
    var main = this.main,
      name = main.getAttribute('data-component'),
      ref = main.getAttribute(references.referenceAttribute);

    edit.getData(ref).then(function (data) {
      formCreator.createForm(name, data);
    });
  },

  publish: function () {
    alert('published'); // eslint-disable-line
    // todo: figure out publish functionality
  }
};

module.exports = EditorToolbar;
