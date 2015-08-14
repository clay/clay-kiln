var componentEdit = require('../controllers/component-edit'),
  componentEditName = 'component-edit',
  db = require('./db'),
  dom = require('./dom'),
  ds = require('dollar-slice'),
  edit = require('./edit'),
  references = require('./references'),
  select = require('./select');

/**
 * Test if element is a component and not the toolbar.
 * @param {Element} el
 * @returns {boolean}
 */
function isComponent(el) {
  var ref = el instanceof Element && el.getAttribute(references.referenceAttribute),
    name = ref && references.getComponentNameFromReference(ref);

  return !!(name && name !== 'editor-toolbar');
}

/**
 * Returns an array of elements that are components from an el and its children.
 * @param {Element} el  Note: element must exist in the DOM so that querySelectorAll works.
 * @returns {array}
 */
function findComponents(el) {
  var children = [].slice.call(dom.findAll(el, '[' + references.referenceAttribute + ']')),
    selfAndChildren = [el].concat(children),
    components = selfAndChildren.filter(isComponent);

  return components;
}

/**
 * Adds selector to a component element. Is async because needs to get data.
 * @param {Element} el    The component element.
 * @returns {Promise|undefined}
 */
function addComponentSelector(el) {
  var ref = el.getAttribute(references.referenceAttribute);

  return edit.getData(ref)
    .then(function (data) {
      var options = {
        ref: ref,
        path: el.getAttribute(references.editableAttribute),
        data: data
      };

      select.handler(el, options);
      return el;
    }).catch(function (e) {
      var options;

      // tried to get the schema of a component, and it 404'd
      if (e.message === '404') {
        options = {
          ref: ref,
          path: el.getAttribute(references.editableAttribute),
          data: {}
        };

        select.handler(el, options);
        return el;
      } else {
        // something weird happened.
        return e;
      }
    });
}

/**
 * Add handlers to all of the element and all of its children that are components.
 * @param {Element} el
 * @returns {Promise}
 */
function addComponentsHandlers(el) {
  ds.controller(componentEditName, componentEdit);
  // First, add the selectors.
  return Promise.all(findComponents(el).map(addComponentSelector))
    .then(function (els) {
      // Then, add controllers/decorators after all selectors have be added.
      return Promise.all(els.map(function (componentEl) {
        return ds.get(componentEditName, componentEl); // async because gets data for editable fields.
      }));
    });
}

/**
 * Reload component with latest HTML from the server.
 * @param {string} ref
 * @returns {Promise}
 */
function reloadComponent(ref) {
  return db.getHTML(ref)
    .then(function (el) {
      var currentEls = dom.findAll('[' + references.referenceAttribute + '="' + ref + '"]');

      switch (currentEls.length) {
        case 0: // Element was already removed from the DOM.
          break;
        case 1: // Normal case.
          dom.replaceElement(currentEls[0], el);
          return addComponentsHandlers(el);
        default: // Edge case (ref used multiple times on one page).
          window.location.reload();
      }
    });
}

exports.addComponentsHandlers = addComponentsHandlers;
exports.reloadComponent = reloadComponent;
