var _ = require('lodash'),
  componentEdit = require('../controllers/component-edit'),
  componentEditName = 'component-edit',
  db = require('./db'),
  dom = require('./dom'),
  ds = require('dollar-slice'),
  references = require('./references'),
  select = require('./select'),
  edit = require('./edit');

/**
 * Adds event handlers to the component element.
 * @param {Element} el    The component element.
 * @param {string} ref    The component ref.
 */
function addComponentHandlers(el, ref) {
  select.handler(el, { ref: ref }); // note: not passing data or path into here
  ds.controller(componentEditName, componentEdit);
  ds.get(componentEditName, el);
}

/**
 * Reload component with latest HTML from the server.
 * @param {string} ref
 * @returns {Promise}
 */
function reloadComponent(ref) {
  return db.getComponentHTMLFromReference(ref)
    .then(function (updatedEl) {
      var els = dom.findAll('[' + references.referenceAttribute + '="' + ref + '"]');

      _.each(els, function (el) {
        dom.replaceElement(el, updatedEl);
        addComponentHandlers(updatedEl, ref);
      });

      // clear the schema and data cache
      edit.setSchemaCache({});
      edit.setDataCache({});
    });
}

exports.addComponentHandlers = addComponentHandlers;
exports.reloadComponent = reloadComponent;
