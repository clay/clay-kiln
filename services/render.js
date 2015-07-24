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
 * Gets data and adds selector to a component element.
 * @param {Element} el    The component element.
 * @returns {Promise|undefined}
 */
function addComponentSelectors(el) {
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
        return el;
      });
  }
}

/**
 * Add handlers to all of the element and all of its children that are components.
 * @param {Element} el
 */
function addComponentsHandlers(el) {
  var components = [el].concat([].slice.call(dom.findAll(el, '[' + references.referenceAttribute + ']')));

  // first, get the data and add the selectors.
  Promise.all(components.map(addComponentSelectors))
    .then(function (els) {
      // second, add the controller and decorators. This ensures that all selectors are added before the behaviors.
      els.forEach(function (componentEl) {
        if (componentEl) {
          ds.controller(componentEditName, componentEdit);
          ds.get(componentEditName, componentEl);
        }
      });
    });
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
