'use strict';
module.exports = function () {
  var dom = require('../services/dom'),
    db = require('../services/db'),
    references = require('../services/references'),
    formcreator = require('../services/formcreator'),
    templates = require('../services/templates'),
    edit = require('../services/edit'),
    ds = require('dollar-slice');

  function constructor(el) {
    // grab the first component in the primary area
    this.main = dom.find('.main .primary [data-component]');
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

    newPage: function () {
      var articlePage = {
        layout: '/components/nym2015-layout/instances/article',
        main: '/components/story'
      };

      db.postToReference('/pages', articlePage)
        .then(function (res) {
          location.href = res._ref + '.html?edit=true';
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

      edit.getSchemaAndData(ref).then(function (res) {
        var form = formcreator.createForm(name, {schema: res.schema, data: res.data, display: 'meta'}),
          modal = templates.apply('editor-modal', { html: form.outerHTML });
        
        document.body.appendChild(modal);

        // instantiate modal and form controllers
        ds.controller('editor-modal', require('./editor-modal'));
        ds.controller('editor-form', require('./editor-form'));
        ds.get('editor-modal', modal);
        ds.get('editor-form', dom.getFirstChildElement(dom.find(modal, '.editor-modal')), ref);
      });
    },

    publish: function () {
      alert('published');
      // todo: figure out publish functionality
    }
  };

  return constructor;
};