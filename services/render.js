var _ = require('lodash'),
  componentEdit = require('../controllers/component-edit'),
  componentEditName = 'component-edit',
  db = require('./db'),
  dom = require('./dom'),
  ds = require('dollar-slice'),
  edit = require('./edit'),
  references = require('./references'),
  select = require('./select');

/**
 * Adds event handlers to a component element.
 * @param {Element} el    The component element.
 * @returns {Promise|undefined}
 */
function addComponentHandlers(el) {
  var ref = el instanceof Element && el.getAttribute(references.referenceAttribute),
    name = ref && references.getComponentNameFromReference(ref);

  if (name && name !== 'editor-toolbar') {
    return edit.getData(ref)
      .then(function (data) {
        var options = {
          ref: ref,
          path: el.getAttribute(references.editableAttribute),
          data: data
        };

        select.handler(el, options);
        ds.controller(componentEditName, componentEdit);
        ds.get(componentEditName, el);
      });
  }
}

/**
 * Add handlers to all of the element and all of its children that are components.
 * @param {Element} el
 * @returns {Promise}
 */
function addComponentsHandlers(el) {
  var childComponents = dom.findAll(el, '[' + references.referenceAttribute + ']');

  return Promise.all([addComponentHandlers(el)].concat(_.map(childComponents, addComponentHandlers)));
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

      return Promise.all(_.map(els, function (el) {
        // Clone node in case the component is used more than once on the page.
        var clonedEl = updatedEl.cloneNode(true);

        // Add handlers prior to loading into the dom so that 'load' event fires for behaviors i.e. in `select`.
        return addComponentsHandlers(clonedEl)
          .then(function () {
            dom.replaceElement(el, clonedEl);
          });
      }));
    });
}

exports.addComponentsHandlers = addComponentsHandlers;
exports.reloadComponent = reloadComponent;
