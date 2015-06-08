'use strict';
module.exports = function () {
  var dom = require('../services/dom'),
    db = require('../services/db'),
    references = require('../services/references'),
    formCreator = require('../services/form-creator'),
    edit = require('../services/edit');

  function constructor(el) {
    // grab the first component in the primary area
    // todo: make this usable in other layouts...
    this.main = dom.find('.main .primary [' + references.componentAttribute + ']');
    this.toolbar = el;
  }

  // todo: figure out save functionality / autosave
  /*
    idea: autosave happens on a per-component basis
    idea: for now, forms will have explicit save buttons
    question: if I PUT to /component/name/instances/id, is that idempotent? (yes)
    question: should we allow PATCH to /component/name/instances/id with partial data?
   */

  constructor.prototype = {
    events: {
      '.close click': 'close',
      '.new click': 'newPage',
      '.meta click': 'editMetadata',
      '.publish click': 'publish'
    },

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
      alert('published');
      // todo: figure out publish functionality
    }
  };

  return constructor;
};
