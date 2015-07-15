var _ = require('lodash'),
  componentEdit = require('../controllers/component-edit'),
  componentEditName = 'component-edit',
  db = require('./db'),
  dom = require('./dom'),
  ds = require('dollar-slice'),
  references = require('./references'),
  select = require('./select');

/**
 * Adds event handlers to a component element.
 * @param {Element} el    The component element.
 */
function addComponentHandlers(el) {
  var ref = el instanceof Element && el.getAttribute(references.referenceAttribute),
    name = ref && references.getComponentNameFromReference(ref);

  if (name && name !== 'editor-toolbar') {
    select.handler(el, { ref: ref }); // note: not passing data or path into here
    ds.controller(componentEditName, componentEdit);
    ds.get(componentEditName, el);
  }
}

/**
 * Add handlers to all of the element and all of its children that are components.
 * @param {Element} el
 */
function addComponentsHandlers(el) {
  var childComponents = dom.findAll(el, '[' + references.referenceAttribute + ']');

  addComponentHandlers(el);
  _.each(childComponents, addComponentHandlers);
}

/**
 * Get the first element that has the data-ref attribute.
 * The first element in a component does not always have the data-ref attribute. e.g. `<article>` is within `<main>`
 * @param {string} ref
 * @returns {Function} which takes and returns an Element.
 */
function getRefEl(ref) {
  return function (el) {
    var isRefEl = el.getAttribute(references.referenceAttribute) === ref;

    if (!isRefEl) {
      el = dom.find(el, '[' + references.referenceAttribute + '="' + ref + '"]');
    }
    return el;
  };
}

/**
 * Reload component with latest HTML from the server.
 * @param {string} ref
 * @returns {Promise}
 */
function reloadComponent(ref) {
  return db.getComponentHTMLFromReference(ref)
    .then(getRefEl(ref))
    .then(function (updatedEl) {
      var els = dom.findAll('[' + references.referenceAttribute + '="' + ref + '"]');

      _.each(els, function (el) {
        // Clone node in case the component is used more than once on the page.
        var clonedEl = updatedEl.cloneNode(true);

        // Add handlers prior to loading into the dom so that 'load' event fires for behaviors i.e. in `select`.
        addComponentsHandlers(clonedEl);
        dom.replaceElement(el, clonedEl);
      });
    });
}

exports.addComponentsHandlers = addComponentsHandlers;
exports.reloadComponent = reloadComponent;
